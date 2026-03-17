#!/bin/bash
sudo systemctl stop vsftpd
sudo systemctl stop hostapd
sudo systemctl stop dnsmasq
sudo ip link set wlan0 down
sudo ip addr flush dev wlan0
