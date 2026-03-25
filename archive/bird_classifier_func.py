from PIL import Image
import io
from ultralytics import YOLO
from transformers import pipeline
from dotenv import load_dotenv
import os
import psycopg2


# Load environment variables from .env file
load_dotenv()

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
    
    def _crop_top_boxes(self, pil_img, yolo_result, min_conf=0.15, max_crops=3, pad=0.15):
        crops = []
        boxes_meta = []

        boxes = getattr(yolo_result, "boxes", None)
        if boxes is None or len(boxes) == 0:
            return crops, boxes_meta

        xyxy = boxes.xyxy.cpu().numpy()
        conf = boxes.conf.cpu().numpy()

        # take top boxes by confidence
        kept = [(xyxy[i], float(conf[i])) for i in range(len(conf)) if conf[i] >= min_conf]
        kept.sort(key=lambda t: t[1], reverse=True)
        kept = kept[:max_crops]

        W, H = pil_img.size
        for (x1, y1, x2, y2), c in kept:
            bw = x2 - x1
            bh = y2 - y1

            x1p = max(0, int(x1 - pad * bw))
            y1p = max(0, int(y1 - pad * bh))
            x2p = min(W, int(x2 + pad * bw))
            y2p = min(H, int(y2 + pad * bh))

            if x2p <= x1p or y2p <= y1p:
                continue

            crop = pil_img.crop((x1p, y1p, x2p, y2p)).convert("RGB")
            crops.append(crop)

            boxes_meta.append({
                "xyxy": [x1p, y1p, x2p, y2p],
                "det_conf": c
            })

        return crops, boxes_meta
    

    def create_guess_records(self, predictions, record_id, conn):
        # Implementation for creating guess records
        cursor = conn.cursor()
        # Now iterate through the results and insert them into the database
        for guess in predictions:
            # First: see if a new record needs to be inserted into species_dictionary
            cursor.execute("SELECT species_id FROM species_dictionary WHERE species_name = %s", (guess['label'],))
            species_result = cursor.fetchone()
            if not species_result:
                cursor.execute("INSERT INTO species_dictionary (species_name) VALUES (%s) RETURNING species_id", (guess['label'],))
                species_id = cursor.fetchone()[0]
            else:
                species_id = species_result[0]
            # Then: insert a new record into GuessRecord with the appropriate foreign key to species_dictionary
            cursor.execute(
                "INSERT INTO birdguesses (record_id, species_id, model, model_confidence) VALUES (%s, %s, %s, %s)",
                (record_id, species_id, 'dennisjooo/Birds-Classifier-EfficientNetB2', guess['score'])
            )
        conn.commit()
        cursor.close()

    # Prediction
    def predict(
    self,
    files,
    filenames,
    yolo_conf=0.15,
    yolo_iou=0.4, # merge/suppress overlapping detections
    max_crops=3,
    hf_model=None,
    hf_device=-1,
    pad=0.15, # pad crops for better classification
    min_box_area_ratio=0.005 # skip tiny boxes (0.5% of image area)
):
        model_id = hf_model or self.default_hf_model
        classifier = self._get_classifier(model_id, hf_device)

        # Run YOLO once as a batch
        yolo_results = self.yolo(files, conf=yolo_conf, iou=yolo_iou, agnostic_nms=True, verbose=False)

        output = []

        for img, name, result in zip(files, filenames, yolo_results):
            W, H = img.size
            img_area = W * H

            # build region proposals from top detections
            boxes = getattr(result, "boxes", None)
            regions = []

            if boxes is not None and len(boxes) > 0:
                xyxy = boxes.xyxy.cpu().numpy()
                conf = boxes.conf.cpu().numpy()

                kept = [(i, float(conf[i])) for i in range(len(conf)) if conf[i] >= yolo_conf]
                kept.sort(key=lambda t: t[1], reverse=True)
                kept = kept[:max_crops]

                crops = []
                meta = []

                for i, det_conf in kept:
                    x1, y1, x2, y2 = xyxy[i]
                    bw = x2 - x1
                    bh = y2 - y1

                    # skip tiny regions (often noise)
                    if (bw * bh) < (min_box_area_ratio * img_area):
                        continue

                    # pad + clamp
                    x1p = max(0, int(x1 - pad * bw))
                    y1p = max(0, int(y1 - pad * bh))
                    x2p = min(W, int(x2 + pad * bw))
                    y2p = min(H, int(y2 + pad * bh))
                    if x2p <= x1p or y2p <= y1p:
                        continue

                    crops.append(img.crop((x1p, y1p, x2p, y2p)).convert("RGB"))
                    meta.append({"xyxy": [x1p, y1p, x2p, y2p], "det_conf": det_conf})

                if crops:
                    preds = classifier(crops)  # list per crop (top-k list)
                    for m, p in zip(meta, preds):
                        regions.append({
                            **m,
                            "bird_top1": p[0],
                            "bird_top5": p
                        })
                    classified_on = "yolo_top_boxes"
                else:
                    # YOLO had boxes but they were filtered out as tiny/invalid
                    full = classifier(img)
                    regions = [{
                        "xyxy": [0, 0, W, H],
                        "det_conf": None,
                        "bird_top1": full[0],
                        "bird_top5": full
                    }]
                    classified_on = "full_image_fallback"
            else:
                # no YOLO boxes at all
                full = classifier(img)
                regions = [{
                    "xyxy": [0, 0, W, H],
                    "det_conf": None,
                    "bird_top1": full[0],
                    "bird_top5": full
                }]
                classified_on = "full_image_fallback"

            # Choose a best guess per image (highest HF top1 score across regions)
            best = max((r["bird_top1"] for r in regions), key=lambda d: d["score"])

            output.append({
                "filename": name,
                "classified_on": classified_on,
                "num_regions": len(regions),
                "best_guess": best,
                "regions": regions
            })
        
        return output