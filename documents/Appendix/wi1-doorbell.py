import RPi.GPIO as GPIO
import subprocess
import threading
import time
import os

DOORBELL_PIN = 17
TIMER_DURATION = 1800

hotspot_timer = None
hotspot_running = False

START_SCRIPT = '/home/pi/start_wifi_ftp.sh'
STOP_SCRIPT = '/home/pi/stop_wifi_ftp.sh'
LOG_FILE = '/home/pi/doorbell.log'

def log_press():
	timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
	with open(LOG_FILE, "a") as f:
		f.write(f"{timestamp} - Doorbell pressed\n")
	subprocess.run(['logger', '-t', 'doorbell', f'Doorbell pressed at {timestamp}'])

def stop_hotspot():
	global hotspot_running
	subprocess.run(['sudo', STOP_SCRIPT])
	hotspot_running = False

def turn_on_wifi(channel):
	global hotspot_timer, hotspot_running
	log_press()
	if not hotspot_running:
		subprocess.run(['sudo', START_SCRIPT])
		hotspot_running = True
	else:
		pass

	if hotspot_timer is not None:
		hotspot_timer.cancel()

	hotspot_timer = threading.Timer(TIMER_DURATION, stop_hotspot)
	hotspot_timer.start()


GPIO.setmode(GPIO.BCM)
GPIO.setup(DOORBELL_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.add_event_detect(DOORBELL_PIN, GPIO.FALLING, callback=turn_on_wifi, bouncetime=300)

try:
	while True:
		time.sleep(1)
except KeyboardInterrupt:
	GPIO.cleanup()
