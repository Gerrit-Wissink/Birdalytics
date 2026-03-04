from PIL import Image
import io
from ultralytics import YOLO
from transformers import pipeline

def read_images_from_request(request):
    files = request.files.getlist("files")

    if not files:
        files = request.files.getlist("files[]")

    images = []
    filenames = []

    for f in files:
        if not f or not f.filename:
            continue

        if not (f.mimetype or "").startswith("image/"):
            continue

        img = Image.open(io.BytesIO(f.read())).convert("RGB")

        images.append(img)
        filenames.append(f.filename)

    return images, filenames

class BirdPipeline:

    def __init__(self, yolo_weights, default_hf_model):

        # Load YOLO detector
        self.yolo = YOLO(yolo_weights)

        # Default bird classifier
        self.default_hf_model = default_hf_model

        # Cache HF pipelines
        self._hf_cache = {}


    # Load / cache HuggingFace classifier
    def _get_classifier(self, model_id, device):

        key = (model_id, device)

        if key not in self._hf_cache:
            self._hf_cache[key] = pipeline(
                "image-classification",
                model=model_id,
                device=device
            )

        return self._hf_cache[key]

    # Crop bird boxes from YOLO output
    def _crop_birds(
        self,
        pil_img,
        yolo_result,
        bird_class_id=14,
        min_conf=0.25,
        max_crops=3
    ):

        crops = []
        boxes_meta = []

        boxes = getattr(yolo_result, "boxes", None)

        if boxes is None or len(boxes) == 0:
            return crops, boxes_meta

        xyxy = boxes.xyxy.cpu().numpy()
        cls = boxes.cls.cpu().numpy().astype(int)
        conf = boxes.conf.cpu().numpy()

        # Filter bird detections
        kept = [
            (xyxy[i], float(conf[i]))
            for i in range(len(cls))
            if cls[i] == bird_class_id and conf[i] >= min_conf
        ]

        kept.sort(key=lambda x: x[1], reverse=True)
        kept = kept[:max_crops]

        W, H = pil_img.size

        for (x1, y1, x2, y2), c in kept:

            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(W, int(x2))
            y2 = min(H, int(y2))

            if x2 <= x1 or y2 <= y1:
                continue

            crop = pil_img.crop((x1, y1, x2, y2)).convert("RGB")

            crops.append(crop)

            boxes_meta.append({
                "xyxy": [x1, y1, x2, y2],
                "det_conf": c
            })

        return crops, boxes_meta

    # Prediction
    def predict(
        self,
        files,
        filenames,
        yolo_conf=0.25,
        max_crops=3,
        bird_class_id=14,
        hf_model=None,
        hf_device=-1
    ):

        model_id = hf_model or self.default_hf_model

        classifier = self._get_classifier(model_id, hf_device)

        # Run YOLO detection
        yolo_results = self.yolo(files, conf=yolo_conf, verbose=False)

        output = []

        for img, name, result in zip(files, filenames, yolo_results):

            crops, boxes = self._crop_birds(
                img,
                result,
                bird_class_id=bird_class_id,
                min_conf=yolo_conf,
                max_crops=max_crops
            )

            # Classify bird crops
            predictions = classifier(crops) if crops else []

            output.append({
                "filename": name,
                "num_birds": len(crops),
                "boxes": boxes,
                "bird_predictions": predictions
            })

        return output