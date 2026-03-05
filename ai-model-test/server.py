from flask import Flask, request, jsonify
from bird_classifier_func import BirdPipeline, read_images_from_request

# Create a Flask application instance
app = Flask(__name__)

# TODO: Update to accept more models
pipeline = BirdPipeline(
    yolo_weights="yolov8n.pt",
    default_hf_model="dennisjooo/Birds-Classifier-EfficientNetB2",
)

# Define a route for the home page that accepts GET requests
@app.route('/')
def home():
    return "Hello, World! I am listening for requests."

# Define a route for handling formData, specifically POST requests
@app.post("/predict")
def predict():
    box_name = request.form.get("boxName")

    images, names = read_images_from_request(request)
    if not images:
        return jsonify({"error": "no images"}), 400

    results = pipeline.predict(images, names)

    return jsonify({
        "boxName": box_name,
        "results": results
    })

# Run the application
if __name__ == '__main__':
    # This makes the server externally visible (0.0.0.0) and runs on port 6000 by default
    app.run(host='0.0.0.0', port=6000)