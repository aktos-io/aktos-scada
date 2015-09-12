require! {
  '../../modules/aktos-dcs': {
    RactivePartial,
    IoActor,
  }
}
  
RactivePartial! .register ->
  $ \.gauge .each ->
    
    elem = $ this
    actor = IoActor elem
        
    type = actor.get-ractive-var \type
    
    # common parameters
    params = 
      width: 200
      height: 200
      renderTo: actor.actor-id
      glow: true
      highlights: do
        [
          from: 40
          to: 60
          color: \PaleGreen
          do
            from: 60
            to: 80
            color: \Khaki
          do
            from: 80
            to: 100
            color: \LightSalmon
        ]
      animation: do
        delay: 10
        duration: 300
        fn: \bounce
      colors: do
        title: \green
    
    if type is \upload
      params : $.extend params, do
        units : \Mbps
        title : \Upload
        strokeTicks : false
    else if type is \download
      params : $.extend params, do
        highlights : false
        units : \Mbps
        title : \Download
    else if type is \ping
      params : $.extend params, do
        glow : false
        units : \ms
        title : \Ping
        max-value : 1000
        major-ticks : ['0','100','200','300','400','500','600','700','800','900','1000']
        highlights : false
        value-format : { int : 4, dec : 1 }
        colors: do
          needle : { start : 'lightgreen', end : 'navy' }
          plate : \lightyellow
          title : \green
          units : \lightgreen
          major-ticks : \darkgreen
          minor-ticks : \lightgreen
          numbers : \darkgreen
        animation: do
          delay : 25
          duration : 500
          fn : \elastic
    else if type is \speed
      params : $.extend params, do
        units : \Kmh
        min-value : 0
        max-value : 220
        major-ticks : ['0','20','40','60','80','100','120','140','160','180','200','220']
        minor-ticks : 2
        highlights : 
          * { from : 0,   to : 50, color : 'rgba(0,   255, 0, .15)' }
          * { from : 50, to : 100, color : 'rgba(255, 255, 0, .15)' }
          * { from : 100, to : 150, color : 'rgba(255, 30,  0, .25)' }
          * { from : 150, to : 200, color : 'rgba(255, 0,  225, .25)' }
          * { from : 200, to : 220, color : 'rgba(0, 0,  255, .25)' }
        colors: do
          needle : { start : 'rgba(240, 128, 128, 1)', end : 'rgba(255, 160, 122, .9)' }
          plate : \#222
          title : \#fff
          units : \#ccc
          numbers : \#eee
          major-ticks : \#f5f5f5
          minor-ticks : \#ddd
      

    gauge = new Gauge params
    
    gauge.draw!
    
    actor.add-callback (msg) ->
      gauge.set-value msg.val