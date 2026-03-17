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
        file_name_map,
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

        try:
            # Open database connection
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST"),
                database=os.getenv("DB_NAME"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD")
            )

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

                record_id = file_name_map.get(name)

                # If no record ID is found for the filename, log a warning and skip database insertion for this image
                if record_id is None:
                    print(f"Warning: No record ID found for filename '{name}'. Skipping database insertion for this image.")
                else:
                    #insert predictions into database
                    self.create_guess_records(predictions, record_id, conn)

                    output.append({
                        "filename": name,
                        "num_birds": len(crops),
                        "boxes": boxes,
                        "bird_predictions": predictions
                    })
            conn.close()
        except Exception as e:
            print("Error during image processing operations:", e)

        return output