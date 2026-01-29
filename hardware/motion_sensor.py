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

while True:
    if motion_sensor.is_active:
        capture_time = datetime.datetime.now()
        timestamp = capture_time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "birdbox_" + timestamp
        path = {home_dir} + "/Photos/" + filename + ".jpg" # TODO: fix this. it's the only thing not working right now
        print("Motion detected. Capturing photo...")
        bird_cam.start_and_capture_file(path)
        print("Photo saved to " + path)
        sleep(15)
    else:
        print("Waiting for motion...")
        sleep(1)