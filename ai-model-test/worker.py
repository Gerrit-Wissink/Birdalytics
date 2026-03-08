import io
import time
import signal
from PIL import Image
from db import get_connection
from bird_class import BirdPipeline

IDLE_SLEEP_SECONDS = 2
BUSY_SLEEP_SECONDS = 0.1
BATCH_SIZE = 5
running = True

pipeline = BirdPipeline(
    yolo_weights="yolov8n.pt",
    default_hf_model="dennisjooo/Birds-Classifier-EfficientNetB2"
)

def claim_jobs(conn, batch_size=BATCH_SIZE):
    with conn.transaction():
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, event_type, record_id
                FROM outbox_events
                WHERE processed = FALSE
                ORDER BY id
                LIMIT %s
                FOR UPDATE SKIP LOCKED
                """,
                (batch_size,)
            )
            return cur.fetchall()

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
    return img, f"record_{record_id}.jpg"

def get_or_create_species(conn, label):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO species_dictionary (species_name)
            VALUES (%s)
            ON CONFLICT (LOWER(species_name))
            DO UPDATE SET species_name = EXCLUDED.species_name
            RETURNING species_id
            """,
            (label,)
        )

        row = cur.fetchone()
        return row["species_id"]

def upsert_birdguess(conn, record_id, result, model_name):
    best = result["best_guess"]
    label = best["label"]
    confidence = best["score"]

    species_id = get_or_create_species(conn, label)

    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO birdguesses (record_id, species_id, model, model_confidence)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (record_id, model)
            DO UPDATE SET
                species_id = EXCLUDED.species_id,
                model_confidence = EXCLUDED.model_confidence
            RETURNING record_id, species_id, model, model_confidence
            """,
            (record_id, species_id, model_name, confidence)
        )

        print("birdguess upserted:", cur.fetchone())

def mark_job_processed(conn, job_id):
    with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE outbox_events
                SET processed = TRUE
                WHERE id = %s
                """,
                (job_id,)
            )

def process_job(conn, job):
    img, filename = load_image_for_record(conn, job["record_id"])

    results = pipeline.predict(
        files=[img],
        filenames=[filename]
    )

    result = results[0]

    with conn.transaction():
        upsert_birdguess(conn, job["record_id"], result, pipeline.default_hf_model)
        mark_job_processed(conn, job["id"])

def shutdown_handler(signum, frame):
    global running
    print("Shutdown signal received...")
    running = False

signal.signal(signal.SIGINT, shutdown_handler)   # Ctrl+C
signal.signal(signal.SIGTERM, shutdown_handler)  # system kill

def main():
    print("Worker started")

    with get_connection() as conn:
        while running:
            jobs = claim_jobs(conn)

            if not jobs:
                time.sleep(IDLE_SLEEP_SECONDS)
                continue

            for job in jobs:
                try:
                    if job["event_type"] == "birdrecord.created":
                        process_job(conn, job)
                        print(f"Processed job {job['id']}")
                except Exception as e:
                    print(f"Error processing job {job['id']}: {e}")

            time.sleep(BUSY_SLEEP_SECONDS)

    print("Worker shutdown complete")

if __name__ == "__main__":
    main()