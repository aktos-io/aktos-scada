require! {
  '../../modules/aktos-dcs': {
    RactivePartial,
    IoActor, 
  }
}
  
require! {
  '../../modules/prelude': {
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

  
RactivePartial! .register ->
  $ \.line-graph .each ->
    actor = IoActor $ this 
    
    elem = actor.node.find \.line-graph__graph
    
    if (actor.get-ractive-var \wid)? 
      actor.node.add-class \draggable 
    
    
    #console.log "this is graph widget: ", elem, actor.actor-name
    
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
    
    y-max = 100
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
    plot = $.plot ('#' + actor.actor-id), get-graph-data!, do 
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
