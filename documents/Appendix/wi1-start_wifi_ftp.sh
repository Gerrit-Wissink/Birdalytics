#!/bin/bash
sudo ip addr add 192.168.50.1/24 dev wlan0
sudo ip link set wlan0 up
sudo systemctl start hostapd
sudo systemctl start dnsmasq
sudo systemctl start vsftpd
