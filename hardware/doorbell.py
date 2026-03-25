from gpiozero import Button
# import RPi.GPIO as GPIO
import subprocess
import threading
import time
import os

home_dir = os.environ['HOME']
doorbell_pin = 17 # The pin in which the momentary switch/doorbell is connected to.
timer_duration = 1800 # Time, in seconds, that the LAN network should be up for.

hotspot_timer = None
hotspot_running = False

start_script = '/home/birdalytics/start_wifi_ftp.sh' # The path for the script to start the LAN hotspot.
stop_script = '/home/birdalytics/stop_wifi_ftp.sh' # The path for the script to stop the LAN hotspot.
log_file = '/home/birdalytics/doorbell.log' # The path for the logging file whenever hardware events are made.

# log_press() will record any instance in which a doorbell press is detected.
# This event will be recorded in both the log_file, as well as the system log.
def log_press():
	timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
	subprocess.run(['touch', log_file])
	with open(log_file, "a") as f:
		f.write(f"{timestamp} - Doorbell pressed\n")
	subprocess.run(['logger', '-t', 'doorbell', f'Doorbell pressed at {timestamp}'])

# stop_hotspot() will disable the LAN hotspot on the Pi, disabling any network access.
def stop_hotspot():
	global hotspot_running
	subprocess.run(['sudo', 'bash', stop_script])
	hotspot_running = False

# turn_on_wifi() will enable the LAN hotspot on the Pi if it is not yet running.
# If it is currently running, then the timer will be extended.
def turn_on_wifi(channel):
	print("Doorbell pressed. Starting hotspot")
	global hotspot_timer, hotspot_running
	log_press()
	if not hotspot_running:
		subprocess.run(['sudo', 'bash', start_script])
		hotspot_running = True
	else:
		pass

	if hotspot_timer is not None:
		hotspot_timer.cancel()

	hotspot_timer = threading.Timer(timer_duration, stop_hotspot)
	hotspot_timer.start()

doorbell = Button(doorbell_pin) #, True,.3)
doorbell.when_pressed = turn_on_wifi
# GPIO.setmode(GPIO.BCM)
# GPIO.setup(doorbell_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
# GPIO.add_event_detect(doorbell_pin, GPIO.FALLING, callback=turn_on_wifi, bouncetime=300)

try:
	while True:
		print("Listening for input...")
		time.sleep(1)
except KeyboardInterrupt:
	print("Process manually interrupted. Exiting...")
	# GPIO.cleanup()