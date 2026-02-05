# This is currently a test script for the motion sensor. 
# This comment block will be removed when things are working as intended.
import config
from gpiozero import DigitalInputDevice as GPIO
from picamera2 import Picamera2 as Camera
from time import sleep
from threading import Timer
import datetime
import os

# Code to initialize the camera
print("Starting camera...")
bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()
print("Camera started successfully.")

motion_sensor = GPIO(config.motion_pin_id)
time_inactive = 0

# capture_photo() will take a photo using the attached camera and save it into the Pictures directory 
# located in the Pi's home directory.
# Files are saved under the format BoxX_yyyy-mm-dd_HH-MM-SS, with the date/time being the time of capture.
# It will output one of two things depending on whether motion was detected (condition = 1) 
# or if the amount of time defined by interval_time has passed (condition = 2).
def capture_photo(condition):
        capture_time = datetime.datetime.now()
        timestamp = capture_time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "BoxX_" + timestamp # Replace X with location name/ID
        path = config.home_dir + "/Pictures/" + filename + ".jpg"
        if condition == 1:
            print("Motion detected.")
        elif condition == 2:
            print("Time elapsed.")
        else:
            raise ValueError("Fatal error! Unknown condition " + condition)
        print("Capturing photo...")
        bird_cam.capture_file(path)
        print("Photo saved to " + path)
        sleep(config.motion_snooze_time)

# This loop will do the following:
# First, it will check every second if motion has been detected. 
# If it is, take a photo immediately, then wait for the interval time.
# If motion is not detected for the amount of time defined by interval_time, then take a photo.
# Otherwise, increment the timer. The timer is reset whenever a photo is taken.
# These steps will be repeated until one of the capturing conditons are met.
while True:
    print ("Looking for motion... (Photo will be taken automatically if " + str(config.interval_time) + " second(s) have passed)")
    sleep(1)
    if motion_sensor.is_active:
        capture_photo(1)
        time_inactive = 0
    elif time_inactive >= config.interval_time:   
        capture_photo(2)
        time_inactive = 0
    else:
        time_inactive += 1