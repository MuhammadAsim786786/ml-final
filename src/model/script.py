"""
predict.py — Single-image inference for DeepSkinCNN v4
=======================================================
Usage:
    python predict.py
    python predict.py --image path/to/skin_image.jpg
    python predict.py --image path/to/image.jpg --model path/to/model_v4.pth

Outputs a ranked probability table for all 7 skin disease classes,
with a clear top-prediction banner and confidence bar chart.

Requirements: model_v4.pth, labels.json (produced by train.py / save_artifacts())
"""

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
import torchvision.transforms as T


# =============================================================================
# ANSI COLOURS  (auto-disabled if terminal doesn't support them)
# =============================================================================
_USE_COLOUR = sys.stdout.isatty() or os.environ.get("FORCE_COLOUR")

class C:
    RESET  = "\033[0m"    if _USE_COLOUR else ""
    BOLD   = "\033[1m"    if _USE_COLOUR else ""
    DIM    = "\033[2m"    if _USE_COLOUR else ""
    GREEN  = "\033[92m"   if _USE_COLOUR else ""
    YELLOW = "\033[93m"   if _USE_COLOUR else ""
    RED    = "\033[91m"   if _USE_COLOUR else ""
    CYAN   = "\033[96m"   if _USE_COLOUR else ""
    BLUE   = "\033[94m"   if _USE_COLOUR else ""
    MAGENTA= "\033[95m"   if _USE_COLOUR else ""
    WHITE  = "\033[97m"   if _USE_COLOUR else ""
    BG_DARK= "\033[40m"   if _USE_COLOUR else ""


# =============================================================================
# DEFAULT PATHS  (mirror train.py CONFIG exactly)
# =============================================================================
DEFAULT_MODEL_PATH  = "model_v4.pth"
DEFAULT_LABELS_PATH = "labels.json"

# Fallback class names (used when labels.json is missing)
FALLBACK_CLASS_NAMES = [
    "Basal Cell Carcinoma (BCC)",
    "Benign Keratosis-like Lesions (BKL)",
    "Eczema",
    "Melanocytic Nevi (NV)",
    "Melanoma",
    "Seborrheic Keratoses and other Benign Tumors",
    "Warts Molluscum and other Viral Infections",
]

# Colour per rank (top-3 highlighted, rest dimmed)
RANK_COLOURS = [C.GREEN, C.YELLOW, C.CYAN, C.DIM, C.DIM, C.DIM, C.DIM]

# Risk tags for clinical context  (purely informational, not medical advice)
RISK_TAG = {
    "Basal Cell Carcinoma (BCC)":                         ("⚠ Malignant",  C.RED),
    "Benign Keratosis-like Lesions (BKL)":                ("✓ Benign",      C.GREEN),
    "Eczema":                                             ("✓ Benign",      C.GREEN),
    "Melanocytic Nevi (NV)":                              ("✓ Benign",      C.GREEN),
    "Melanoma":                                           ("⚠ Malignant",  C.RED),
    "Seborrheic Keratoses and other Benign Tumors":       ("✓ Benign",      C.GREEN),
    "Warts Molluscum and other Viral Infections":         ("✓ Benign",      C.GREEN),
}


# =============================================================================
# MODEL DEFINITION  (verbatim from train.py — no external dependency)
# =============================================================================

class StochasticDepth(nn.Module):
    def __init__(self, drop_rate: float = 0.0):
        super().__init__()
        self.drop_rate = drop_rate

    def forward(self, x):
        # Inference: always a pass-through (training=False)
        if not self.training or self.drop_rate == 0.0:
            return x
        survival = 1.0 - self.drop_rate
        mask = torch.rand(x.size(0), 1, 1, 1, device=x.device) < survival
        return x * mask.float() / survival


class ChannelAttention(nn.Module):
    def __init__(self, channels: int, reduction: int = 8):
        super().__init__()
        bottleneck    = max(channels // reduction, 4)
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
        scale   = self.sigmoid(avg_out + max_out).view(x.size(0), x.size(1), 1, 1)
        return x * scale


class SpatialAttention(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv    = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        avg_out    = torch.mean(x, dim=1, keepdim=True)
        max_out, _ = torch.max(x, dim=1, keepdim=True)
        combined   = torch.cat([avg_out, max_out], dim=1)
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
        self.act       = nn.GELU()
        self.pool      = nn.MaxPool2d(2)
        self.dropout   = nn.Dropout2d(dropout)

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
        self.cbam      = CBAM(channels)
        self.drop_path = StochasticDepth(drop_path_rate)
        self.act       = nn.GELU()
        self.dropout   = nn.Dropout2d(dropout)

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
        self.block6_cbam      = CBAM(768)
        self.block6_drop_path = StochasticDepth(0.20)
        self.block6_shortcut  = nn.Sequential(
            nn.Conv2d(512, 768, kernel_size=1, bias=False), nn.BatchNorm2d(768)
        )
        self.block6_act     = nn.GELU()
        self.block6_dropout = nn.Dropout2d(0.30)

        self.refine1 = RefineBlock(768, 0.30, 0.20)
        self.refine2 = RefineBlock(768, 0.30, 0.20)
        self.gap     = nn.AdaptiveAvgPool2d(1)

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(768, 512), nn.BatchNorm1d(512), nn.GELU(), nn.Dropout(0.50),
            nn.Linear(512, 256), nn.BatchNorm1d(256), nn.GELU(), nn.Dropout(0.40),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.block5(self.block4(self.block3(self.block2(self.block1(x)))))
        out = self.block6_drop_path(self.block6_cbam(self.block6_conv(x)))
        x   = self.block6_dropout(self.block6_act(out + self.block6_shortcut(x)))
        x   = self.refine2(self.refine1(x))
        return self.classifier(self.gap(x))


# =============================================================================
# PREPROCESSING  (must match training transforms exactly)
# =============================================================================

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

def build_transform(image_size: int = 224) -> T.Compose:
    return T.Compose([
        T.Resize((image_size, image_size)),
        T.ToTensor(),
        T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])


def load_image(image_path: str, image_size: int = 224) -> torch.Tensor:
    """Load an image from disk, convert to RGB, apply inference transforms."""
    img = Image.open(image_path).convert("RGB")
    transform = build_transform(image_size)
    return transform(img).unsqueeze(0)   # [1, 3, H, W]


# =============================================================================
# LABEL LOADING
# =============================================================================

def load_class_names(labels_path: str) -> list[str]:
    if os.path.exists(labels_path):
        with open(labels_path) as f:
            lmap = json.load(f)
        return [lmap[str(i)] for i in range(len(lmap))]
    print(f"{C.YELLOW}[warn] labels.json not found — using built-in class names.{C.RESET}")
    return FALLBACK_CLASS_NAMES


# =============================================================================
# INFERENCE
# =============================================================================

def predict(model: nn.Module, image_tensor: torch.Tensor,
            device: torch.device) -> np.ndarray:
    """Return softmax probability array of shape [num_classes]."""
    model.eval()
    with torch.no_grad():
        logits = model(image_tensor.to(device))
        probs  = torch.softmax(logits, dim=1)[0]
    return probs.cpu().numpy()


# =============================================================================
# DISPLAY
# =============================================================================

def sep(char: str = "─", width: int = 70) -> None:
    print(C.DIM + char * width + C.RESET)


def bar(prob: float, width: int = 30, filled: str = "█", empty: str = "░") -> str:
    n = round(prob * width)
    return filled * n + empty * (width - n)


def confidence_label(prob: float) -> tuple[str, str]:
    if prob >= 0.70:
        return "HIGH",    C.GREEN
    if prob >= 0.40:
        return "MEDIUM",  C.YELLOW
    return "LOW", C.RED


def print_results(class_names: list[str], probs: np.ndarray,
                  image_path: str) -> None:
    """Pretty-print the ranked prediction table."""
    order = np.argsort(probs)[::-1]   # descending

    top_name = class_names[order[0]]
    top_prob = float(probs[order[0]])
    conf_lbl, conf_col = confidence_label(top_prob)

    tag_text, tag_col = RISK_TAG.get(top_name, ("", ""))

    width = 70
    print()
    sep("═", width)
    print(f"{C.BOLD}{C.WHITE}  DeepSkinCNN v4  —  Classification Result{C.RESET}")
    sep("═", width)

    print(f"\n  {C.DIM}Image :{C.RESET} {image_path}")
    print()

    # ── Top prediction banner ──────────────────────────────────────────────
    print(f"  {C.BOLD}▶️  TOP PREDICTION{C.RESET}")
    print(f"  {C.BOLD}{C.WHITE}{top_name}{C.RESET}  "
          f"{tag_col}{tag_text}{C.RESET}")
    print(f"  Confidence  :  {conf_col}{C.BOLD}{top_prob*100:.1f}%{C.RESET}"
          f"  [{conf_col}{conf_lbl}{C.RESET}]")
    print()
    sep("─", width)

    # ── Full ranked breakdown ──────────────────────────────────────────────
    col_name = max(len(n) for n in class_names) + 2
    print(f"\n  {C.BOLD}{'Rank':<5} {'Disease':<{col_name}} {'Probability':>11}  {'Bar':>32}{C.RESET}")
    sep("─", width)

    for rank, idx in enumerate(order, 1):
        name = class_names[idx]
        prob = float(probs[idx])
        col  = RANK_COLOURS[rank - 1]

        rank_str  = f"#{rank}"
        prob_str  = f"{prob*100:5.2f}%"
        bar_str   = bar(prob)
        tag_t, tc = RISK_TAG.get(name, ("", C.DIM))

        print(
            f"  {col}{rank_str:<5} {name:<{col_name}} {prob_str:>8}  "
            f"{bar_str}{C.RESET}  {tc}{tag_t}{C.RESET}"
        )

    sep("─", width)

    # ── Entropy / uncertainty note ─────────────────────────────────────────
    entropy  = float(-np.sum(probs * np.log(probs + 1e-9)))
    max_ent  = float(np.log(len(probs)))
    norm_ent = entropy / max_ent   # 0=certain, 1=uniform

    ent_bar = bar(norm_ent, width=20)
    ent_lbl = (
        "Very confident" if norm_ent < 0.25 else
        "Fairly confident" if norm_ent < 0.50 else
        "Uncertain" if norm_ent < 0.75 else
        "Very uncertain"
    )
    print(f"\n  {C.DIM}Model uncertainty : {ent_bar} {norm_ent*100:.1f}%  — {ent_lbl}{C.RESET}")

    sep("═", width)
    print(f"\n  {C.DIM}⚕  This tool is for research / development purposes only.")
    print(f"     Not a substitute for professional medical diagnosis.{C.RESET}\n")


# =============================================================================
# IMAGE PATH INPUT
# =============================================================================

def prompt_image_path() -> str:
    """Interactively ask the user for an image path until a valid one is given."""
    print()
    sep("═")
    print(f"{C.BOLD}{C.WHITE}  DeepSkinCNN v4  —  Skin Disease Classifier{C.RESET}")
    sep("═")
    print(f"\n  Supported formats: JPG, JPEG, PNG, BMP, TIFF, WEBP\n")

    while True:
        raw = input(f"  {C.CYAN}Enter image path{C.RESET} (or drag-and-drop): ").strip().strip('"').strip("'")
        if not raw:
            print(f"  {C.YELLOW}No path entered. Please try again.{C.RESET}")
            continue
        if not os.path.isfile(raw):
            print(f"  {C.RED}File not found: {raw!r}. Please check the path and try again.{C.RESET}")
            continue
        ext = Path(raw).suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}:
            print(f"  {C.YELLOW}Unrecognised extension '{ext}'. Attempting anyway...{C.RESET}")
        return raw


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="DeepSkinCNN v4 — single-image skin disease classifier"
    )
    parser.add_argument("--image",  "-i", type=str, default=None,
                        help="Path to the input skin image")
    parser.add_argument("--model",  "-m", type=str, default=DEFAULT_MODEL_PATH,
                        help=f"Path to model weights (default: {DEFAULT_MODEL_PATH})")
    parser.add_argument("--labels", "-l", type=str, default=DEFAULT_LABELS_PATH,
                        help=f"Path to labels.json (default: {DEFAULT_LABELS_PATH})")
    parser.add_argument("--size",         type=int, default=224,
                        help="Image resize resolution (default: 224, must match training)")
    parser.add_argument("--cpu",          action="store_true",
                        help="Force CPU inference even if CUDA is available")
    args = parser.parse_args()

    # ── Device ───────────────────────────────────────────────────────────────
    device = torch.device("cpu" if args.cpu or not torch.cuda.is_available() else "cuda")
    print(f"\n  {C.DIM}Device : {device}{C.RESET}")

    # ── Load class names ─────────────────────────────────────────────────────
    class_names = load_class_names(args.labels)

    # ── Load model ───────────────────────────────────────────────────────────
    if not os.path.exists(args.model):
        sys.exit(
            f"\n{C.RED}[error] Model file not found: '{args.model}'\n"
            f"        Train the model first, or pass --model /path/to/model_v4.pth{C.RESET}\n"
        )

    print(f"  {C.DIM}Model  : {args.model}{C.RESET}")
    model = DeepSkinCNN(num_classes=len(class_names)).to(device)
    model.load_state_dict(
        torch.load(args.model, map_location=device, weights_only=True)
    )
    model.eval()

    # ── Image path ───────────────────────────────────────────────────────────
    image_path = args.image if args.image else prompt_image_path()

    # ── Preprocess + infer ───────────────────────────────────────────────────
    print(f"\n  {C.DIM}Loading image…{C.RESET}")
    try:
        image_tensor = load_image(image_path, image_size=args.size)
    except Exception as exc:
        sys.exit(f"\n{C.RED}[error] Could not load image: {exc}{C.RESET}\n")

    print(f"  {C.DIM}Running inference…{C.RESET}")
    probs = predict(model, image_tensor, device)

    # ── Display ──────────────────────────────────────────────────────────────
    print_results(class_names, probs, image_path)

    # ── Optional: loop for another image ─────────────────────────────────────
    while True:
        again = input("  Classify another image? [y/N]: ").strip().lower()
        if again not in {"y", "yes"}:
            print(f"\n  {C.DIM}Goodbye.{C.RESET}\n")
            break
        image_path = prompt_image_path()
        try:
            image_tensor = load_image(image_path, image_size=args.size)
        except Exception as exc:
            print(f"\n{C.RED}[error] Could not load image: {exc}{C.RESET}")
            continue
        probs = predict(model, image_tensor, device)
        print_results(class_names, probs, image_path)


if __name__ == "__main__":
    main()