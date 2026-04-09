from gpiozero import MotionSensor
from picamera2 import Picamera2 as Camera
import time
import subprocess
import threading

box_id = 'X' # Replace X with location name/ID.
motion_pin = 27 # The pin on the Raspberry Pi that is connected to the data pin on the motion sensor.
interval_time = 900 # Minimum time, in seconds, to wait before automatically taking a photo.
motion_snooze_time = 120 # Time, in seconds, to wait between taking photos after a picture is taken.
log_file = '/home/birdalytics/doorbell.log' # The path for the logging file whenever hardware events are made.

# Code to initialize the camera
print("Starting camera...")
bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()
print("Camera started successfully.")

# Initializing the motion sensor to send data to the pin specified by motion_pin
motion_sensor = MotionSensor(motion_pin)

# motion_timer() defines the time to wait before capturing a photo if no motion is detected.
# Once the timer defined by cam_timer elapses, 
def motion_timer():
    global cam_timer
    cam_timer = threading.Timer(interval_time, capture_photo(2))
    cam_timer.start()
motion_timer()

# capture_photo() will take a photo using the attached camera and save it to the Raspberry Pi's storage.
# Files are saved in the Home's Pictures directory, under the format BoxX_yyyy-mm-dd_HH-MM-SS, with the date/time being the time of capture.
# The console will output a statement based on what triggered the capture:
# if motion was detected (condition = 1), or if the amount of time defined by interval_time has passed (condition = 2).
def capture_photo(condition):
        timestamp = time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "Box" + box_id + "_" + timestamp
        path = "/home/birdalytics/Pictures/" + filename + ".jpg"
        if condition == 1:
            with open(log_file, "a") as f:
                f.write(f"{timestamp} - Photo taken (motion detection)\n")
            print("Motion detected.")
            subprocess.run(['logger', '-t', 'motion_sensor', f'Photo taken at {timestamp} (motion detection)'])
        elif condition == 2:
            with open(log_file, "a") as f:
                f.write(f"{timestamp} - Photo taken (time elapsed)\n")
            print("Time elapsed.")
            subprocess.run(['logger', '-t', 'motion_sensor', f'Photo taken at {timestamp} (time elapsed)'])
        else:
            raise ValueError("Fatal error! Unknown condition " + condition)
        print("Capturing photo...")
        bird_cam.capture_file(path)
        print("Photo saved to " + path)
        time.sleep(motion_snooze_time)
        motion_timer()

motion_sensor.wait_for_motion()
capture_photo(1)

# The try/except statements are present for the sake of cleanup.
# If the program is manually interrupted, then the processes will not terminate correctly, hence the need for the try/except.
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("Process manually interrupted. Exiting...")