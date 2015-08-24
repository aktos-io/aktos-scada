from aktos_dcs import *
from aktos_dcs_lib import * 

class KeypadSimulator(Actor):
    def handle_IoMessage(self, msg):
        msg = msg_body(msg)
        print "keypad simulator got io message:", msg['pin_name'], msg['val']

        if msg['pin_name'] == "test-slider":
            print "slider value changed to: ", msg['val']

    def action(self):
        i = 0
        while True:
            print "sending analog-1 value: ", time.time()
            self.send({'IoMessage':{'pin_name':'analog-1', 'val':i}})
            self.send({'IoMessage':{'pin_name':'analog-2', 'val':i*10}})
            i += 1
            sleep(1)



ProxyActor()

virtual_inputs = {
    'slider-1': None, 
    'slider-2': None, 
}

for pin_name, pin_number in virtual_inputs.items():
    VirtualIoActor(pin_name=pin_name, pin_number=pin_number)

KeypadSimulator()
wait_all()
