"""
FastAPI inference server for DeepSkinCNN v4.
Local dev:  MODEL_PATH=src/model/model_v4.pth uvicorn inference.server:app --port 8000
HF Space:   started automatically via Dockerfile (PORT=7860, model in same dir)
"""

import io
import os
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as T
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# ---------------------------------------------------------------------------
# Model definition (verbatim from script.py / train.py)
# ---------------------------------------------------------------------------

class StochasticDepth(nn.Module):
    def __init__(self, drop_rate: float = 0.0):
        super().__init__()
        self.drop_rate = drop_rate

    def forward(self, x):
        if not self.training or self.drop_rate == 0.0:
            return x
        survival = 1.0 - self.drop_rate
        mask = torch.rand(x.size(0), 1, 1, 1, device=x.device) < survival
        return x * mask.float() / survival


class ChannelAttention(nn.Module):
    def __init__(self, channels: int, reduction: int = 8):
        super().__init__()
        bottleneck = max(channels // reduction, 4)
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.mlp = nn.Sequential(
            nn.Flatten(),
            nn.Linear(channels, bottleneck, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(bottleneck, channels, bias=False),
        )
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = self.mlp(self.avg_pool(x))
        max_out = self.mlp(self.max_pool(x))
        scale = self.sigmoid(avg_out + max_out).view(x.size(0), x.size(1), 1, 1)
        return x * scale


class SpatialAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        combined = torch.cat([avg_out, max_out], dim=1)
        return x * self.sigmoid(self.conv(combined))


class CBAM(nn.Module):
    def __init__(self, channels: int, reduction: int = 8):
        super().__init__()
        self.channel_att = ChannelAttention(channels, reduction)
        self.spatial_att = SpatialAttention()

    def forward(self, x):
        return self.spatial_att(self.channel_att(x))


class ConvBlock(nn.Module):
    def __init__(self, in_ch: int, out_ch: int, dropout: float = 0.25,
                 use_residual: bool = False, drop_path_rate: float = 0.0):
        super().__init__()
        self.use_residual = use_residual
        self.conv_path = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.GELU(),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
        )
        self.cbam = CBAM(out_ch)
        self.shortcut = (
            nn.Sequential(nn.Conv2d(in_ch, out_ch, kernel_size=1, bias=False),
                          nn.BatchNorm2d(out_ch))
            if use_residual and in_ch != out_ch else None
        )
        self.drop_path = StochasticDepth(drop_path_rate)
        self.act = nn.GELU()
        self.pool = nn.MaxPool2d(2)
        self.dropout = nn.Dropout2d(dropout)

    def forward(self, x):
        out = self.drop_path(self.cbam(self.conv_path(x)))
        if self.use_residual:
            out = out + (self.shortcut(x) if self.shortcut else x)
        return self.dropout(self.pool(self.act(out)))


class RefineBlock(nn.Module):
    def __init__(self, channels: int, dropout: float = 0.30, drop_path_rate: float = 0.0):
        super().__init__()
        self.conv_path = nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
            nn.GELU(),
            nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(channels),
        )
        self.cbam = CBAM(channels)
        self.drop_path = StochasticDepth(drop_path_rate)
        self.act = nn.GELU()
        self.dropout = nn.Dropout2d(dropout)

    def forward(self, x):
        out = self.drop_path(self.cbam(self.conv_path(x)))
        return self.dropout(self.act(out + x))


class DeepSkinCNN(nn.Module):
    def __init__(self, num_classes: int = 7):
        super().__init__()
        self.block1 = ConvBlock(3,   64,  0.15, False, 0.00)
        self.block2 = ConvBlock(64,  128, 0.20, True,  0.05)
        self.block3 = ConvBlock(128, 256, 0.25, True,  0.10)
        self.block4 = ConvBlock(256, 384, 0.25, True,  0.15)
        self.block5 = ConvBlock(384, 512, 0.30, True,  0.20)

        self.block6_conv = nn.Sequential(
            nn.Conv2d(512, 768, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(768), nn.GELU(),
            nn.Conv2d(768, 768, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(768),
        )
        self.block6_cbam = CBAM(768)
        self.block6_drop_path = StochasticDepth(0.20)
        self.block6_shortcut = nn.Sequential(
            nn.Conv2d(512, 768, kernel_size=1, bias=False), nn.BatchNorm2d(768)
        )
        self.block6_act = nn.GELU()
        self.block6_dropout = nn.Dropout2d(0.30)

        self.refine1 = RefineBlock(768, 0.30, 0.20)
        self.refine2 = RefineBlock(768, 0.30, 0.20)
        self.gap = nn.AdaptiveAvgPool2d(1)

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(768, 512), nn.BatchNorm1d(512), nn.GELU(), nn.Dropout(0.50),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.GELU(), nn.Dropout(0.40),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.block5(self.block4(self.block3(self.block2(self.block1(x)))))
        out = self.block6_drop_path(self.block6_cbam(self.block6_conv(x)))
        x = self.block6_dropout(self.block6_act(out + self.block6_shortcut(x)))
        x = self.refine2(self.refine1(x))
        return self.classifier(self.gap(x))


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# Must match the training class order exactly
CLASS_IDS = [
    "bcc",
    "bkl",
    "eczema",
    "melanocytic-nevi",
    "melanoma",
    "seborrheic-keratoses",
    "warts-molluscum",
]

# MODEL_PATH env var lets local dev point to src/model/model_v4.pth
# On HF Space the model sits next to this file, so the default works.
MODEL_PATH = Path(os.environ.get("MODEL_PATH", Path(__file__).parent / "model_v4.pth"))

TRANSFORM = T.Compose([
    T.Resize((224, 224)),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

_state: dict = {}


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DeepSkinCNN(num_classes=7).to(device)
    model.load_state_dict(
        torch.load(MODEL_PATH, map_location=device, weights_only=True)
    )
    model.eval()
    _state["model"] = model
    _state["device"] = device
    print(f"Model loaded from {MODEL_PATH} on {device}")
    yield
    _state.clear()


app = FastAPI(title="DermaScan Inference API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not decode image")

    tensor = TRANSFORM(img).unsqueeze(0).to(_state["device"])

    with torch.no_grad():
        logits = _state["model"](tensor)
        probs: np.ndarray = torch.softmax(logits, dim=1)[0].cpu().numpy()

    scores = {class_id: float(probs[i]) for i, class_id in enumerate(CLASS_IDS)}
    return {"scores": scores}
