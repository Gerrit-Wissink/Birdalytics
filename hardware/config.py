import os

# The GPIO pin ID on the Raspberry Pi that the motion sensor is connected to. This should not need to be changed.
motion_pin_id = 17 

# TODO: Change interval_time to the appropriate length once script testing is complete.
# Time, in seconds, to determine how much time should be taken between captures.
interval_time = 900

# Time, in seconds, to determing how much time the system should be inactive after taking a photo from the motion sensor.
motion_snooze_time = 120

home_dir = os.environ['HOME']