require! {
  '../../modules/aktos-dcs': {
    RactivePartial,
    IoActor,
  }
}

RactivePartial! .register ->
  $ '.b-stacked-progress' .each !->
    elem = $ this
    actor = IoActor elem


    if (actor.get-ractive-var \wid)?
      actor.node.add-class \draggable

    elem.find \.progress .remove-class \active

    actor.add-callback (msg)->
      #console.log "slider changed: ", msg.val
      actor.set-ractive-var  \val, msg.val
