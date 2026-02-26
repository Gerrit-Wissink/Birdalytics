# config.py contains variables that may be used across multiple scripts for the Raspberry Pi.
import os

# the ID of the box being used on the database. This should not be changed until the respective box has been added to the database.
box_id = 0

# The GPIO pin ID on the Raspberry Pi that the motion sensor is connected to. This should not need to be changed.
motion_pin_id = 17

# The GPIO pin ID on the Raspberry Pi that the LAN enable switch is connected to. This also should not need to be changed.
button_pin_id = 0 # TODO: Find a pin or method to detect the signals coming from the push button.

# Time, in seconds, to determine how much time should be taken between captures. 
# The default time is 900 seconds (15 minutes).
interval_time = 900

# Time, in seconds, to determing how much time the system should be inactive after taking a photo from the motion sensor.
# The default time is 120 seconds (2 minutes).
motion_snooze_time = 120

home_dir = os.environ['HOME']