#!/bin/bash 

./mjpg_streamer -i "./input_uvc.so -d /dev/video0  -n -y -f 5 -r 200x100" -o "./output_http.so -w ./www" 

