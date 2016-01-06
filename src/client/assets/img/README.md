# Naming Conventions for images (PNG)

1. choose a `image-name` with lowercase and separated with a dash ('-') if multiword and add ('-on' or '-off') flag.

    Example : 'image1-name-off.png' and 'image1-name-on.png'
    
# Usage

1. add the status-led partial and write the image file name to src

    Example : {{>status-led {pin_name: 'scada-test-pin-1', wid: 8, src: 'computer'} }}
