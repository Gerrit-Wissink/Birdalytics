from PIL import Image
import io
from ultralytics import YOLO
from transformers import pipeline

def load_image_for_record(conn, record_id):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT br.record_id, i.image
            FROM birdrecords br
            JOIN images i ON i.image_id = br.image_id
            WHERE br.record_id = %s
            """,
            (record_id,)
        )
        row = cur.fetchone()

    if not row:
        raise ValueError(f"No image found for record_id={record_id}")

    img = Image.open(io.BytesIO(row["image"])).convert("RGB")
    filename = f"record_{record_id}.jpg"

    return img, filename

def return_top_results(num=3, regions=None):
    if not regions:
        return None

    all_preds = []
    for r in regions:
        all_preds.extend(r.get("bird_top5", []))

    if not all_preds:
        return None

    all_preds.sort(key=lambda d: d["score"], reverse=True)
    return all_preds[:num]

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
        print(f"Running prediction on {len(files)} image(s) with model '{hf_model or self.default_hf_model}'")
        model_id = hf_model or self.default_hf_model
        classifier = self._get_classifier(model_id, hf_device)

        # Run YOLO once as a batch
        print("Running YOLO detection...")
        yolo_results = self.yolo(files, conf=yolo_conf, iou=yolo_iou, agnostic_nms=True, verbose=False)
        print("YOLO detection completed.")
        print(f"YOLO results: {[len(getattr(r, 'boxes', [])) for r in yolo_results]} boxes detected across {len(files)} image(s)")

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

                print("Creating crops from YOLO detections...")
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
                    print(f"Running classification on {len(crops)} crop(s) from YOLO detections...")
                    preds = classifier(crops)  # list per crop (top-k list)
                    for m, p in zip(meta, preds):
                        regions.append({
                            **m,
                            "bird_top1": p[0],
                            "bird_top5": p
                        })
                    classified_on = "yolo_top_boxes"
                    print(f"Classification completed on {len(crops)} crop(s).")
                else:
                    # YOLO had boxes but they were filtered out as tiny/invalid
                    print("YOLO detections were all filtered out, skipping classification")
                    classified_on = None

                if not regions:
                    print("No valid regions after filtering YOLO detections, skipping classification")
                    output.append({
                        "filename": name,
                        "classified_on": "error",
                        "num_regions": 0,
                        "best_guesses": None,
                        "regions": []
                    })
                else: 
                    # Choose a top 3 guesses per image (highest HF top1 score across regions)
                    print("Selecting top guesses across regions...")
                    best = return_top_results(num=3, regions=regions)

                    print("Appending results...")
                    output.append({
                        "filename": name,
                        "classified_on": classified_on,
                        "num_regions": len(regions),
                        "best_guesses": best,
                        "regions": regions
                    })
            else:
                # no YOLO boxes at all
                print("No YOLO detections, skipping classification")
                output.append({
                    "filename": name,
                    "classified_on": None,
                    "num_regions": 0,
                    "best_guesses": None,
                    "regions": []
                })
                
        print("All images processed.")
        for item in output:
            print(f"Image: {item['filename']}")
            if item['best_guesses']:
                for guess in item['best_guesses']:
                    print(f"  - {guess['label']}: {guess['score']:.4f}")
            else:
                print("  - No guesses")
        return output