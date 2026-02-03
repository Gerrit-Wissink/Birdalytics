# This is currently a test script for the motion sensor. 
# This comment block will be removed when things are working as intended.
from gpiozero import DigitalInputDevice as GPIO
from picamera2 import Picamera2 as Camera
from time import sleep
from threading import Timer
import datetime
import os

motion_pin_id = 17 # The GPIO pin ID on the Raspberry Pi that the motion sensor is connected to. This should not need to be changed.
# TODO: Change interval_time to the appropriate length once script testing is complete.
interval_time = 15 # Time, in seconds, to determine how much time should be taken between captures.
home_dir = os.environ['HOME']

# Code to initialize the camera
bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()

motion_sensor = GPIO(17)

def capture_photo(condition):
        capture_time = datetime.datetime.now()
        timestamp = capture_time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "birdbox_" + timestamp
        path = home_dir + "/Photos/" + filename + ".jpg" # TODO: fix this. it's the only thing not working right now
        if condition == 1:
            print("Motion detected.")
        elif condition == 2:
            print("Time elapsed.")
        else:
            raise ValueError("Fatal error! Unknown condition " + condition)
        print("Capturing photo...")
        bird_cam.capture_file(path)
        print("Photo saved to " + path)
        sleep(interval_time)

while True:
    if motion_sensor.is_active:
        capture_photo(1)
    else:   
        Timer(interval_time, capture_photo, 2)