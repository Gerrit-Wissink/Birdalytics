from gpiozero import MotionSensor
from picamera2 import Picamera2 as Camera
import time
import subprocess
import shutil
import glob
import os
import threading

box_id = 'X' # Replace X with location name/ID.
motion_pin = 27 # The pin on the Raspberry Pi that is connected to the data pin on the motion sensor.
interval_time = 900 # Minimum time, in seconds, to wait before automatically taking a photo.
motion_snooze_time = 120 # Time, in seconds, to wait between taking photos after a picture is taken.
log_file = '/home/birdalytics/doorbell.log' # The path for the logging file whenever hardware events are made.
buffer_gb = 2 # The minimum amount of free space, in GB
photo_dir = '/home/birdalytics/Pictures/' # The directory where photos will be saved. Make sure to end with a '/'. The directory must already exist, and the program does not have permissions to create a new directory.

# Code to initialize the camera
print('Starting camera...')
bird_cam = Camera()
bird_cam.create_still_configuration()
bird_cam.start()
print('Camera started successfully.')

# Initializing the motion sensor to send data to the pin specified by motion_pin
sensor = MotionSensor(motion_pin)

# enforce_storage_limit() checks the free storage space on the Raspberry Pi, and deletes old photos if the free space is below the defined buffer_gb.
def enforce_storage_limit(folder_path):
    def get_free_gb(path):
        total, used, free = shutil.disk_usage(path)
        return free / (1024 ** 3)  # Convert bytes to GB
    
    global storage_check_running
    storage_check_running = True

    free_gb = get_free_gb(folder_path) # Check free space before cleanup

    if free_gb >= buffer_gb:
        storage_check_running = False
        return  # all good, nothing to delete. should only be true on initial setup

    # Could print something, but 'low storage' is expected considering files will be continuously deleted
    # print(f'Low storage detected: {free_gb:.2f} GB free. Cleaning up...')

    files = glob.glob(os.path.join(folder_path, '*'))

    # sort oldest first
    files.sort(key=os.path.getmtime)

    # Delete files until we have enough free space
    i = 0
    while free_gb < buffer_gb and i < len(files):
        try:
            os.remove(files[i])
            print('Deleted:', files[i])
        except OSError:
            storage_check_running = False
            pass
        i += 1
        free_gb = get_free_gb(folder_path)
    
    storage_check_running = False

storage_check = threading.Thread(target=enforce_storage_limit, args=(photo_dir,))

# capture_photo() will take a photo using the attached camera and save it to the Raspberry Pi's storage.
# Files are saved in the Home's Pictures directory, under the format BoxX_yyyy-mm-dd_HH-MM-SS, with the date/time being the time of capture.
# The console will output a statement based on what triggered the capture:
# if motion was detected (condition = 1), or if the amount of time defined by interval_time has passed (condition = 2).
def capture_photo(condition):
    timestamp = time.strftime('%Y-%m-%d_%H-%M-%S')
    filename = 'Box' + box_id + '_' + timestamp
    path = os.path.join(photo_dir, filename + '.jpg')
    if condition == 1:
        with open(log_file, 'a') as f:
            f.write(f'{timestamp} - Photo taken (motion detection)\n')
            print('Motion detected.')
            subprocess.run(['logger', '-t', 'motion_sensor', f'Photo taken at {timestamp} (motion detection)'])
    elif condition == 2:
        with open(log_file, 'a') as f:
            f.write(f'{timestamp} - Photo taken (time elapsed)\n')
            print('Time elapsed.')
            subprocess.run(['logger', '-t', 'motion_sensor', f'Photo taken at {timestamp} (time elapsed)'])
    else:
        raise ValueError('Fatal error! Unknown condition ' + str(condition))
    print('Capturing photo...')
    bird_cam.capture_file(path)
    print('Photo captured and saved to ' + path)

# The try/except statements are present for the sake of cleanup.
# If the program is manually interrupted, then the processes will not terminate correctly, hence the need for the try/except.
try:
    while True:
        print('Waiting for motion...')
        sensor.wait_for_motion(interval_time)
        if sensor.motion_detected:
            capture_photo(1)
            time.sleep(motion_snooze_time)
        else: 
            capture_photo(2)
        if not storage_check_running:
            storage_check.start()
        else:
            pass
except KeyboardInterrupt:
    print('Process manually interrupted. Exiting...')