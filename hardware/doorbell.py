from gpiozero import Button
import subprocess
import threading
import time

doorbell_pin = 17 # The pin in which the momentary switch/doorbell is connected to.
timer_duration = 1800 # Time, in seconds, that the LAN network should be up for.

# Initialize the LAN hotspot status.
hotspot_timer = None
hotspot_running = False

# Specifications for file paths.
# NOTE: The start/stop scripts should enable/disable the following system services:
# hostapd to allow for devices to connect to the Raspberry Pi.
# dnsmasq for DNS caching, recording any devices that connect to the Raspberry Pi.
# vsftpd to enable FTP file transfer between the Raspberry Pi and any devices that connect to it.
# All of these MUST be preinstalled onto the Raspberry Pi before running this script. For more details, consult the documentation.
start_script = '/home/birdalytics/start_wifi_ftp.sh' # The path for the script to start the LAN hotspot.
stop_script = '/home/birdalytics/stop_wifi_ftp.sh' # The path for the script to stop the LAN hotspot.
log_file = '/home/birdalytics/doorbell.log' # The path for the logging file whenever hardware events are made.

# log_press() will record any instance in which a doorbell press is detected.
# This event will be recorded in both the log_file, as well as the system log.
# Timestamps are in the format of yyyy-mm-dd HH:MM:SS. 
def log_press():
	timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
	with open(log_file, "a") as f:
		f.write(f"{timestamp} - Doorbell pressed\n")
	subprocess.run(['logger', '-t', 'doorbell', f'Doorbell pressed at {timestamp}'])

# stop_hotspot() will disable the LAN hotspot on the Pi, disabling any network access.
def stop_hotspot():
	global hotspot_running
	subprocess.run(['sudo', 'bash', stop_script])
	hotspot_running = False

# turn_on_wifi() controls the status of the LAN hotspot on the Raspberry Pi.
# If the hotspot is NOT currently running, then the hotspot will be enabled, along with a timer that runs for the time specified by timer_duration.
# Additionally, a file labeled "Doorbell" will be made with a timestamp to denote a separation between data retrieval sessions.
# If the hotspot is already currently running, then the timer will be reset.
def turn_on_wifi(channel):
	print("Doorbell pressed. Starting hotspot...")
	global hotspot_timer, hotspot_running
	log_press()
	if not hotspot_running:
		subprocess.run(['sudo', 'bash', start_script])
		timestamp = time.strftime('%Y-%m-%d_%H-%M-%S')
		filename = 'Doorbell_' + timestamp
		subprocess.run(['sudo', 'touch', filename])
		hotspot_running = True
	else:
		pass

	if hotspot_timer is not None:
		hotspot_timer.cancel()

	hotspot_timer = threading.Timer(timer_duration, stop_hotspot)
	hotspot_timer.start()

# Enables the doorbell on the pin specified by doorbell_pin.
doorbell = Button(doorbell_pin)

# When the doorbell is pressed, executes turn_on_wifi().
doorbell.when_pressed = turn_on_wifi

# This try/except statements are present for the sake of cleanup.
# If the program is manually interrupted, then the processes will not terminate correctly, hence the need for the try/except
try:
	while True:
		time.sleep(1)
except KeyboardInterrupt:
	print("Process manually interrupted. Exiting...")