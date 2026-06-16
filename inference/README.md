---
title: DermaScan Inference
emoji: 🔬
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
app_port: 7860
---

# DermaScan Inference API

FastAPI server for DeepSkinCNN v4 — 7-class skin disease classification.

## Endpoint

`POST /predict` — multipart form upload with field `file` (any image format).

Returns:
```json
{
  "scores": {
    "bcc": 0.03,
    "bkl": 0.12,
    "eczema": 0.67,
    "melanocytic-nevi": 0.08,
    "melanoma": 0.02,
    "seborrheic-keratoses": 0.05,
    "warts-molluscum": 0.03
  }
}
```
