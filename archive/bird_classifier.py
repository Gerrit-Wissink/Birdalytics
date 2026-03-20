from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch


# Load model and processor
processor = AutoImageProcessor.from_pretrained("chriamue/bird-species-classifier")
model = AutoModelForImageClassification.from_pretrained("chriamue/bird-species-classifier")


# Function to predict top 5 birds
def predict_top5(image_path):
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)[0]

    # Get top 5 predictions
    top5_prob, top5_idx = torch.topk(probs, 5)
    top5 = [(model.config.id2label[idx.item()], prob.item()) for idx, prob in zip(top5_idx, top5_prob)]
    return top5

# Example usage with multiple images
image_paths = [
    "ai-model-test\\images\\Test1.jpg",
    "ai-model-test\\images\\Test1-1.jpg",
    "ai-model-test\\images\\Test2.jpg",
    "ai-model-test\\images\\Test2-1.jpg",
    "ai-model-test\\images\\Test3.jpg",
    "ai-model-test\\images\\Test3-1.jpg",
    "ai-model-test\\images\\Test4.jpg",
    "ai-model-test\\images\\Test4-1.jpg",
    "ai-model-test\\images\\Test5.jpg",
    "ai-model-test\\images\\Test6.jpg",
    "ai-model-test\\images\\Test7.jpg",
    "ai-model-test\\images\\Test8.jpg",
    "ai-model-test\\images\\Test9.jpg",
]

for path in image_paths:
    print(f"\nPredictions for {path}:")
    for species, conf in predict_top5(path):
        print(f"  {species}: {conf:.2f}")
        
        
        
# Predictions for ai-model-test\images\Test1.jpg: # Bird seen from above in a deep nesting box; tests performance in low-light/shadowed conditions.
#   PEREGRINE FALCON: 0.42
#   BLACK COCKATO: 0.23
#   GREATER PRAIRIE CHICKEN: 0.21
#   LONG-EARED OWL: 0.02
#   NORTHERN GOSHAWK: 0.02

# Predictions for ai-model-test\images\Test1-1.jpg: # Same as 1, but cropped.
#   AMERICAN KESTREL: 0.54
#   PEREGRINE FALCON: 0.28
#   BLACK COCKATO: 0.04
#   ORNATE HAWK EAGLE: 0.04
#   MERLIN: 0.01

# Predictions for ai-model-test\images\Test2.jpg: # Bird and eggs in a wooden box; tests ability to distinguish the bird from similar-colored wood.
#   OILBIRD: 0.43
#   ELLIOTS  PHEASANT: 0.27
#   WILD TURKEY: 0.15
#   SUNBITTERN: 0.06
#   GOLDEN PHEASANT: 0.02

# Predictions for ai-model-test\images\Test2-1.jpg: # Same as 2, but cropped.
#   AMERICAN KESTREL: 0.47
#   ELLIOTS  PHEASANT: 0.11
#   GREATER PRAIRIE CHICKEN: 0.08
#   SNOW PARTRIDGE: 0.07
#   SMITHS LONGSPUR: 0.02

# Predictions for ai-model-test\images\Test3.jpg: # Extremely low res. Bird on a wire with wings slightly flared; tests impact of resolution. 
#   LONG-EARED OWL: 0.97
#   GREAT POTOO: 0.01
#   CRESTED SERPENT EAGLE: 0.00
#   HARPY EAGLE: 0.00
#   KING VULTURE: 0.00

# Predictions for ai-model-test\images\Test3-1.jpg: # Same as 3, but cropped.
#   CRESTED KINGFISHER: 0.18
#   ORNATE HAWK EAGLE: 0.17
#   BROWN CREPPER: 0.10
#   AMETHYST WOODSTAR: 0.10
#   ABBOTTS BOOBY: 0.07

# Predictions for ai-model-test\images\Test4.jpg: # Bird in a corner of a box with eggs; tests performance with heavy background clutter.
#   GUINEAFOWL: 0.23
#   DOUBLE BARRED FINCH: 0.12
#   GYRFALCON: 0.09
#   HARPY EAGLE: 0.06
#   FAIRY PENGUIN: 0.05

# Predictions for ai-model-test\images\Test4-1.jpg: # Same as 4, but cropped.
#   AMERICAN KESTREL: 0.48
#   ORNATE HAWK EAGLE: 0.16
#   DOUBLE BARRED FINCH: 0.07
#   PEREGRINE FALCON: 0.05
#   AZURE TIT: 0.04

# Predictions for ai-model-test\images\Test5.jpg: # Cropped. Direct eye contact; tests facial feature recognition and chest spotting.
#   AMERICAN KESTREL: 0.99
#   BEARDED REEDLING: 0.00
#   CRESTED NUTHATCH: 0.00
#   MANGROVE CUCKOO: 0.00
#   NORTHERN FLICKER: 0.00

# Predictions for ai-model-test\images\Test6.jpg: # Cropped. Bird perched on a post; tests vertical orientation and common man-made perches.
#   AMERICAN KESTREL: 0.99
#   BLACK THROATED BUSHTIT: 0.00
#   BEARDED REEDLING: 0.00
#   PEREGRINE FALCON: 0.00
#   BELTED KINGFISHER: 0.00

# Predictions for ai-model-test\images\Test7.jpg: # Cropped. Centered but distant on a branch; tests scale invariance.
#   AMERICAN KESTREL: 0.97
#   BEARDED REEDLING: 0.01
#   NORTHERN FLICKER: 0.00
#   GILDED FLICKER: 0.00
#   EUROPEAN TURTLE DOVE: 0.00

# Predictions for ai-model-test\images\Test8.jpg: # Cropped. Classic "textbook" side profile on a branch; acts as the control/baseline for high accuracy.
#   AMERICAN KESTREL: 0.97
#   BLACK THROATED BUSHTIT: 0.01
#   BEARDED REEDLING: 0.00
#   CRESTED NUTHATCH: 0.00
#   MANGROVE CUCKOO: 0.00

# Predictions for ai-model-test\images\Test9.jpg: # Grayscale profile shot on a branch; tests classifier performance without color cues.
#   AMERICAN KESTREL: 0.96
#   PEREGRINE FALCON: 0.03
#   MERLIN: 0.00
#   RED TAILED HAWK: 0.00
#   GYRFALCON: 0.00