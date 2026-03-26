import cv2
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
from ultralytics import YOLO
import os

# Load Classification model
processor = AutoImageProcessor.from_pretrained("dennisjooo/Birds-Classifier-EfficientNetB2")
model = AutoModelForImageClassification.from_pretrained("dennisjooo/Birds-Classifier-EfficientNetB2")

# Load Detection model
detector = YOLO('yolov8n.pt') 

# Define where to save marked images
SAVE_DIR = "ai-model-test/detected_crops"
os.makedirs(SAVE_DIR, exist_ok=True)

def get_bird_crop(image_path):
    results = detector(image_path, verbose=False)
    img_pil = Image.open(image_path).convert("RGB")
    
    # Generate the 'marked' image with bounding boxes
    # results[0].plot() returns a BGR numpy array (OpenCV format)
    annotated_frame = results[0].plot()
    
    # OPTIONAL, REMOVE FOR PRODUCTION USE LOSERS: Save the marked image to see what YOLO found
    filename = os.path.basename(image_path)
    cv2.imwrite(os.path.join(SAVE_DIR, f"marked_{filename}"), annotated_frame)

    # Crop the detected bird
    for box in results[0].boxes:
        if int(box.cls) == 14: # Bird class
            coords = box.xyxy[0].tolist()
            cropped_img = img_pil.crop((coords[0], coords[1], coords[2], coords[3]))
            return cropped_img, True
            
    return img_pil, False

def predict_top5(image_path):
    img, was_cropped = get_bird_crop(image_path)
    
    inputs = processor(images=img, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=1)[0]

    top5_prob, top5_idx = torch.topk(probs, 5)
    top5 = [(model.config.id2label[idx.item()], prob.item()) for idx, prob in zip(top5_idx, top5_prob)]
    return top5, was_cropped

# Example usage
image_paths = [
    "images\\Test1.jpg",
    "images\\Test1-1.jpg",
    "images\\Test2.jpg",
    "images\\Test2-1.jpg",
    "images\\Test3.jpg",
    "images\\Test3-1.jpg",
    "images\\Test4.jpg",
    "images\\Test4-1.jpg",
    "images\\Test5.jpg",
    "images\\Test6.jpg",
    "images\\Test7.jpg",
    "images\\Test8.jpg",
    "images\\Test9.jpg",
]

for path in image_paths:
    print(f"\n--- Processing {path} ---")
    results, cropped = predict_top5(path)
    print(f"Status: {'[AUTO-CROPPED]' if cropped else '[ORIGINAL VIEW]'}")
    for species, conf in results:
        print(f"  {species}: {conf:.2f}")

def process_image(image_path):
    print(f"\n--- Processing {image_path} ---")
    results, cropped = predict_top5(image_path)
    print(f"Status: {'[AUTO-CROPPED]' if cropped else '[ORIGINAL VIEW]'}")
    for species, conf in results:
        print(f"  {species}: {conf:.2f}")