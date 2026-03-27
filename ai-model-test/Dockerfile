FROM python:3.10-slim

WORKDIR /app

ENV YOLO_CONFIG_DIR=/tmp/Ultralytics

COPY Pipfile Pipfile.lock ./

RUN pip install --no-cache-dir pipenv && \
    pipenv install --system --deploy && \
    pip uninstall -y torch torchvision torchaudio && \
    pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchvision

COPY worker.py .
COPY bird_class.py .
COPY db.py .
COPY yolov8n.pt .

CMD ["python", "worker.py"]