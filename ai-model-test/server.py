from flask import Flask, request, jsonify

# Create a Flask application instance
app = Flask(__name__)

# Define a route for the home page that accepts GET requests
@app.route('/')
def home():
    return "Hello, World! I am listening for requests."

# Define a route for handling data, specifically POST requests
@app.route('/data', methods=['POST'])
def handle_data():
    if request.is_json:
        # Get the JSON data sent in the request body
        data = request.get_json()
        print(f"Received data: {data}")
        # Return a JSON response
        return jsonify({"message": "Data received successfully!", "your_data": data}), 200
    else:
        return jsonify({"error": "Request must be JSON"}), 400

# Run the application
if __name__ == '__main__':
    # This makes the server externally visible (0.0.0.0) and runs on port 6969 by default
    app.run(host='0.0.0.0', port=6969)