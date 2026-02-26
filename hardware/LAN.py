import config
from gpiozero import DigitalInputDevice as GPIO
from time import sleep
import os

# TODO: find a pin to wire the LAN enable switch to
push_button = GPIO(config.button_pin_id)

# ensure Wi-Fi isn't running
os.subprocess.run(["rfkill", "block", "wifi"])

while True:
    if push_button.is_active:
        print("Switch detected. Enabling LAN...")
        os.subprocess.run(["rfkill", "unblock", "wifi"])
        sleep(15) # anywhere between 30-60 mins? will need testing
        os.subprocess.run(["rfkill", "block", "wifi"])
        sleep(5)