# This is currently a test script for the motion sensor. 
# This comment block will be removed when things are working as intended.
from gpiozero import DigitalInputDevice as GPIO
from picamera2 import Picamera2 as Camera
from time import sleep
import datetime
import os

motion_pin_id = 17
home_dir = os.environ['HOME']

bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()

motion_sensor = GPIO(17)

def capture_photo(condition):
        capture_time = datetime.datetime.now()
        timestamp = capture_time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "birdbox_" + timestamp
        path = {home_dir} + "/Photos/" + filename + ".jpg" # TODO: fix this. it's the only thing not working right now
        if condition == 1:
            print("Motion detected.")
        elif condition == 2:
            print("Time elapsed.")
        else:
            raise ValueError("Fatal error! Unknown condition " + condition)
        print("Capturing photo...")
        bird_cam.capture_file(path)
        print("Photo saved to " + path)
        sleep(15)

while True:
    if motion_sensor.is_active:
        capture_photo(1)
    elif timepassed:
        capture_photo(2)
    else:
        print("Waiting for motion...")
        sleep(1)