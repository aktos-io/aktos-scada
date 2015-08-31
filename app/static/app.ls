require! {
  '../modules/prelude': {
    flatten,
    initial,
    drop,
    join,
    concat,
    tail,
    head,
    map,
    zip,
    split,
    union,
    last
  }
}


require! {
  '../modules/aktos-dcs': {
    envelp,
    get-msg-body,
    Actor,
    ProxyActor,
  }
}
  
require '../partials/test-widget'

# aktos widget library


get-ractive-variable = (jquery-elem, ractive-variable) ->
  ractive-node = Ractive.get-node-info jquery-elem.get 0
  value = (app.get ractive-node.\keypath)[ractive-variable]
  #console.log "ractive value: ", value
  return value

set-ractive-variable = (jquery-elem, ractive-variable, value) ->
  ractive-node = Ractive.get-node-info jquery-elem.get 0
  if not ractive-node.\keypath
    console.log "ERROR: NO KEYPATH FOUND FOR RACTIVE NODE: ", jquery-elem
    
  app.set ractive-node.\keypath + '.' + ractive-variable, value



class SwitchActor extends Actor
  (pin-name)~>
    super ...
    @callback-functions = []
    @pin-name = String pin-name
    if pin-name
      @actor-name = @pin-name
    else
      @actor-name = @actor-id
      console.log "actor is created with this random name: ", @actor-name
    @ractive-node = null  # the jQuery element
    @connected = false

  add-callback: (func) ->
      @callback-functions ++= [func]

  handle_IoMessage: (msg) ->
    msg-body = get-msg-body msg
    if msg-body.pin_name is @pin-name
      #console.log "switch actor got IoMessage: ", msg
      @fire-callbacks msg-body

  handle_ConnectionStatus: (msg) ->
    # TODO: TEST THIS CIRCULAR REFERENCE IF IT COUSES
    # MEMORY LEAK OR NOT
    @connected = get-msg-body msg .connected
    #console.log "connection status changed: ", @connected
    @refresh-connected-variable! 
    
  refresh-connected-variable: -> 
    if @ractive-node
      #console.log "setting {{connected}}: ", @connected
      set-ractive-variable @ractive-node, 'connected', @connected
    else
      console.log "ractive node is empty! actor: ", this 
    
  set-node: (node) -> 
    #console.log "setting #{this.actor-name} -> ", node
    @ractive-node = node
    
    @send UpdateConnectionStatus: {}

  fire-callbacks: (msg) ->
    #console.log "fire-callbacks called!", msg
    for func in @callback-functions
      func msg

  gui-event: (val) ->
    #console.log "gui event called!", val
    @fire-callbacks do
      pin_name: @pin-name
      val: val

    @send IoMessage: do
      pin_name: @pin-name
      val: val
# ---------------------------------------------------
# END OF LIBRARY FUNCTIONS
# ---------------------------------------------------


set-switch-actors = !->
  $ '.switch-actor' .each !->
    elem = $ this
    pin-name = get-ractive-variable elem, 'pin_name'
    actor = SwitchActor pin-name
    actor.set-node elem
    elem.data \actor, actor

# basic widgets 
set-switch-buttons = !->
  $ '.switch-button' .each !->
    elem = $ this
    actor = elem.data \actor

    # make it work without toggle-switch
    # visualisation
    elem.change ->
      actor.gui-event this.checked
    actor.add-callback (msg) ->
      elem.prop 'checked', msg.val

set-push-buttons = ->
  #
  # TODO: tapping works as doubleclick (two press and release)
  #       fix this.
  #
  $ '.push-button' .each ->
    elem = $ this
    actor = elem.data \actor

    # desktop support
    elem.on 'mousedown' ->
      actor.gui-event on
      elem.on 'mouseleave', ->
        actor.gui-event off
    elem.on 'mouseup' ->
      actor.gui-event off
      elem.off 'mouseleave'

    # touch support
    elem.on 'touchstart' (e) ->
      actor.gui-event on
      elem.touchleave ->
        actor.gui-event off
      e.stop-propagation!
    elem.on 'touchend' (e) ->
      actor.gui-event off

    actor.add-callback (msg) ->
      #console.log "push button got message: ", msg
      if msg.val
        elem.add-class 'button-active-state'
      else
        elem.remove-class 'button-active-state'

set-status-leds = ->
  $ '.status-led' .each ->
    elem = $ this
    actor = elem.data \actor
    actor.add-callback (msg) ->
      #console.log "status led: ", actor.pin-name, msg.val
      set-ractive-variable elem, 'val', msg.val

set-analog-displays = ->
  $ \.analog-display .each ->
    elem = $ this
    channel-name = get-ractive-variable elem, 'pin_name'
    #console.log "this is channel name: ", channel-name
    actor = SwitchActor channel-name
    actor.add-callback (msg) ->
      set-ractive-variable elem, 'val', msg.val

make-basic-widgets = -> 
  set-switch-buttons!
  set-push-buttons!
  set-status-leds!
  set-analog-displays!

# create jq mobile widgets 
make-jq-mobile-widgets = !->
  console.log "mobile connections being done..."
  $ document .ready ->
    #console.log "document ready!"

    # jq-flipswitch-v2
    make-jq-flipswitch-v2 = -> 
      $ \.switch-button .each ->
        #console.log "switch-button created"
        elem = $ this
        actor = elem.data \actor

        send-gui-event = (event) -> 
          #console.log "jq-flipswitch-2 sending msg: ", elem.val!        
          actor.gui-event (elem.val! == \on)

        elem.on \change, send-gui-event
        
        actor.add-callback (msg) ->
          #console.log "switch-button got message", msg
          elem.unbind \change
          
          if msg.val
            elem.val \on .slider \refresh
          else
            elem.val \off .slider \refresh
          
          elem.bind \change, send-gui-event 
          
    make-jq-flipswitch-v2!
        
    # jq-push-button
    make-jq-push-button = -> 
      set-push-buttons!  # inherit basic button settings
      $ \.push-button .each ->
        #console.log "found push-button!"
        elem = $ this
        actor = elem.data \actor
        
        actor.add-callback (msg) ->
          #console.log "jq-push-button got message: ", msg.val
          if msg.val
            elem.add-class 'ui-btn-active'
          else
            elem.remove-class 'ui-btn-active'
          
        # while long pressing on touch devices, 
        # no "select text" dialog should be fired: 
        elem.disable-selection!
        elem.onselectstart = ->
          false
        elem.unselectable = "on"
        elem.css '-moz-user-select', 'none'
        elem.css '-webkit-user-select', 'none'
    
    make-jq-push-button!

    # slider
    make-slider = !->
      $ '.slider' .each !->
        elem = $ this 
        actor = elem.data \actor
        
        #console.log "this slider actor found: ", actor 
        #debugger 
        
        slider = elem.find \.jq-slider 
        slider.slider!
        #console.log "slider created!", slider
        
        curr_val = slider.attr \value
        slider.val curr_val .slider \refresh 
        #console.log "current value: ", curr_val
        
        input = elem.find \.jq-slider-input
        
        input.on \change -> 
          val = get-ractive-variable elem, \val
          actor.gui-event val
          
        
        slider.on \change ->
          #console.log "slider val: ", slider.val!
          actor.gui-event slider.val!
          
        actor.add-callback (msg)->
          #console.log "slider changed: ", msg.val 
          slider.val msg.val .slider \refresh
          set-ractive-variable elem, \val, msg.val 
        
        
    make-slider!
    
    # inherit status leds
    set-status-leds!
    
    # inherit analog displays
    set-analog-displays!


make-jq-page-settings = ->
  navnext = (page) ->
    $.mobile.navigate page

  navprev = (page) ->
    $.mobile.navigate page

  $ window .on \swipe, (event) ->
    navnext \#foo
    #$.mobile.change-page \#foo

make-toggle-switch-visualisation = ->
  $ \.toggle-switch .each !->
    elem = $ this
    actor = elem.data \actor

    s = new ToggleSwitch elem.get 0, 'on', 'off'
    actor.add-callback (msg) ->
      # prevent switch callback call on
      # external events. only change visual status.
      tmp = s.f-callback
      s.f-callback = null
      if msg.val
        s.on!
      else
        s.off!
      s.f-callback = tmp
      tmp = null

    s.add-listener (state) !->
      actor.send-event state
      
jquery-mobile-specific = -> 
  set-project-buttons-height = (height) -> 
    $ \.project-buttons .each -> 
      $ this .height height

  make-windows-size-work = ->
    window-width = $ window .width!
    console.log "window width: #window-width"
    set-project-buttons-height window-width/3.1

  $ window .resize -> 
    #make-windows-size-work!
  
  #make-windows-size-work!
  
  

make-line-graph-widget = -> 

  $ \.line-graph .each ->
    elem = $ this 
    pin-name = get-ractive-variable elem, \pin_name 
    actor = SwitchActor pin-name
    
    
    console.log "this is graph widget: ", elem, actor.actor-name
    
    /*    
    graph-data = -> 
      return do
        * label: 'test'
          data: get-graph-data!
          color: 'white'
        * label: 'test2'
          data: get-graph-data!
          color: 'red'

    */
    data = []
    total-points = 300 
    
    y-max = 1000
    y-min = 0 
    
    push-random-data = -> 
      if data.length > 0
        data := tail data 
        
      while data.length < total-points
        
        prev = if data.length > 0 then last data else y-max / 2

        y = prev + Math.random! * 10  - 5
        y = y-min if y < y-min
        y = y-max if y > y-max 
        
        data.push y 
        
    get-graph-data = -> 
      return [zip [0 to total-points] data]
      
    #console.log "random data: ", get-random-data! 

    push-graph-data = (new-point) ->
      totalPoints = 300
      if data.length > 0 then
        data := tail data
      while data.length < total-points 
        data.push new-point

    
    update-interval = 30 
    
    push-random-data!
    plot = $.plot '#placeholder', get-graph-data!, do 
      series: 
        shadow-size: 0 
      yaxis: 
        min: y-min
        max: y-max
      xaxis:
        show: false
            
    
    refresh = -> 
      plot.set-data get-graph-data!
      plot.draw!
    
    
    update = -> 
      #push-random-data!
      push-graph-data last data
      plot.set-data get-graph-data!
      plot.resize!
      plot.setup-grid!
      plot.draw!
      set-timeout update, update-interval 
      
    update!

    actor.add-callback (msg) -> 
      console.log "line-graph got new value: #{msg.val}"
      push-graph-data msg.val
      #refresh!

make-graph-widgets = -> 
  make-line-graph-widget!

# Set Ractive.DEBUG to false when minified:
Ractive.DEBUG = /unminified/.test !->
  /*unminified*/

app = new Ractive do
  el: 'container'
  template: '#app'

  
## debug
#console.log 'socket.io path: ', addr_port,  socketio-path
#console.log "socket.io socket: ", socket

# Create the actor which will connect to the server
ProxyActor!



app.on 'complete', !->
  #$ '#debug' .append '<p>app.complete started...</p>'
  #console.log "ractive completed, post processing other widgets..."

  # create actors for every widget
  set-switch-actors!

  # create basic widgets
  #make-basic-widgets!

  $ document .ready ->
    # create jquery mobile widgets 
    make-jq-mobile-widgets!
    jquery-mobile-specific!
    # set jquery mobile page behaviour
    #make-jq-page-settings!
  
  # graph widgets
  make-graph-widgets!
  
  #$ \#debug .append '<p>app.complete ended...</p>'
  
  #console.log "window.location: ", window.location
  if not window.location.hash
    window.location = '#home-page'
  #console.log "app.complete ended..."
  
#shortid = require 'modules/shortid/index'
#console.log "shortid: ", shortid
  