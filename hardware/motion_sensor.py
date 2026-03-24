# This is currently a test script for the motion sensor. 
# This comment block will be removed when things are working as intended.
from gpiozero import DigitalInputDevice as GPIO
from picamera2 import Picamera2 as Camera
from time import sleep
import datetime
import os

home_dir = os.environ['HOME']
box_id = 'X' # Replace X with location name/ID
motion_pin_id = 27 # The pin on the Raspberry Pi that is connected to the data pin on the motion sensor.
interval_time = 900 # Minimum time, in seconds, to wait before automatically taking a photo.
motion_snooze_time = 120 # Time, in seconds, to wait between taking photos after a picture is taken.

# Code to initialize the camera
print("Starting camera...")
bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()
print("Camera started successfully.")

motion_sensor = GPIO(motion_pin_id)
time_inactive = 0

# capture_photo() will take a photo using the attached camera and save it to the Raspberry Pi's storage.
# Files are saved in the Home's Pictures directory, under the format BoxX_yyyy-mm-dd_HH-MM-SS, with the date/time being the time of capture.
# The console will output a statement based on what triggered the capture:
# if motion was detected (condition = 1), or if the amount of time defined by interval_time has passed (condition = 2).
def capture_photo(condition):
        capture_time = datetime.datetime.now()
        timestamp = capture_time.strftime("%Y-%m-%d_%H-%M-%S")
        filename = "Box" + box_id + "_" + timestamp
        path = home_dir + "/Pictures/" + filename + ".jpg"
        if condition == 1:
            print("Motion detected.")
        elif condition == 2:
            print("Time elapsed.")
        else:
            raise ValueError("Fatal error! Unknown condition " + condition)
        print("Capturing photo...")
        bird_cam.capture_file(path)
        print("Photo saved to " + path)
        sleep(motion_snooze_time)

# This loop will do the following:
# First, it will check every second if motion has been detected. 
# If it is, take a photo immediately, then wait for the interval time.
# If motion is not detected for the amount of time defined by interval_time, then take a photo.
# Otherwise, increment the timer. The timer is reset whenever a photo is taken.
# These steps will be repeated until one of the capturing conditons are met.
try:
    while True:
        print ("Looking for motion... (Photo will be taken automatically in " + str(interval_time - time_inactive) + " second(s))")
        sleep(1)
        if motion_sensor.is_active:
            capture_photo(1)
            time_inactive = 0
        elif time_inactive >= interval_time:   
            capture_photo(2)
            time_inactive = 0
        else:
            time_inactive += 1
except KeyboardInterrupt:
    print("Process manually interrupted. Exiting...")