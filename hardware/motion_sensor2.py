import os
import time
import shutil
import threading
import subprocess
from datetime import datetime
from gpiozero import MotionSensor

box_id = 'X' 
motion_pin = 27 
interval_time = 900 
motion_snooze_time = 120 
log_file = '/home/birdalytics/doorbell.log' 
buffer_mb = 2048 
photo_dir = "/home/birdalytics/Pictures/" 

# Ensure directory exists
if not os.path.exists(photo_dir):
    os.makedirs(photo_dir)

class SmartCamera:
    def __init__(self):
        # Initializing the sensor
        self.pir = MotionSensor(motion_pin)
        self.last_capture_time = 0
        self.lock = threading.Lock()
        self.timer = None

    # Helpeer to log to both file and system journal.
    def log_event(self, message):
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        full_message = f"{timestamp} - {message}"
        
        # Write to local log file
        with open(log_file, "a") as f:
            f.write(full_message + "\n")
        
        # Write to system logger (viewable via journalctl)
        subprocess.run(['logger', '-t', 'SmartCamera', message])
        print(full_message)

    # enforce_storage_limit() checks the free storage space on the Raspberry Pi, and deletes old photos if the free space is below the defined buffer_mb.
    def cleanup_storage(self):
        while True:
            usage = shutil.disk_usage(photo_dir)
            free_mb = usage.free / (1024 * 1024)
            
            if free_mb >= buffer_mb:
                break
                
            files = sorted([os.path.join(photo_dir, f) for f in os.listdir(photo_dir) if f.endswith('.jpg')], 
                           key=os.path.getctime)
            
            if not files:
                break
            
            os.remove(files[0])
            self.log_event(f"Storage Cleanup: Deleted {os.path.basename(files[0])}")

    # take_photo() captures an image and saves it with a filenme that includes the box ID, timestamp, and trigger reason (motion or timer).
    def take_photo(self, reason):
        with self.lock:
            now = time.time()
            # Enforce snooze cooldown
            if now - self.last_capture_time < motion_snooze_time:
                return

            self.cleanup_storage()
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_name = f"Box{box_id}_{timestamp}_{reason}.jpg"
            full_path = os.path.join(photo_dir, file_name)
            
            # -t 1000 provides 1sec for IR/Exposure calibration
            result = os.system(f"libcamera-still -t 1000 --nopreview -o {full_path}")
            
            if result == 0:
                self.log_event(f"Photo Captured: {file_name} (Trigger: {reason})")
                self.last_capture_time = time.time()
            else:
                self.log_event(f"ERROR: Camera failed to capture image.")
            
            # Always reset the timer regardless of whether photo was taken or snoozed
            self.reset_timer()

    # Cancels existing timer and starts a new countdown.
    def reset_timer(self):
        
        if self.timer:
            self.timer.cancel()
        self.timer = threading.Timer(interval_time, self.take_photo, args=["timer"])
        # Set as daemon so it dies if the main thread dies
        self.timer.daemon = True 
        self.timer.start()

    def run(self):
        self.log_event("System Active. Monitoring motion and timer...")
        self.reset_timer()
        
        # Hardware interrupt for motion
        self.pir.when_motion = lambda: self.take_photo("motion")
        
        try:
            while True:
                # Sleep is very battery efficient
                time.sleep(1)
        except KeyboardInterrupt:
            if self.timer:
                self.timer.cancel()
            self.log_event("System shut down by user.")

if __name__ == "__main__":
    cam = SmartCamera()
    cam.run()