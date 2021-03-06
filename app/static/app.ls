development = no

require! {
  '../modules/aktos-dcs': {
    ProxyActor,
    RactivePartial,
    RactiveApp,
  }
}
# get scada layouts
{widget-positions} = require './scada-layout'

# include widgets' initialize codes
require '../partials/ractive-partials'
# Set Ractive.DEBUG to false when minified:
Ractive.DEBUG = /unminified/.test !-> /*unminified*/

app = new Ractive do
  el: 'container'
  template: if development then '#app' else preparsed
  data:
    marked: marked
    JSON: JSON


# Register ractive app in order to use in partials
RactiveApp!set app

# Create the actor which will connect to the server
proxy-actor = ProxyActor!

app.on 'complete', !->
  # create actors and init widgets
  RactivePartial! .init!

  $ document .ready ->
    console.log "document is ready..."
    RactivePartial! .init-for-document-ready!

    proxy-actor.update-connection-status!

    RactivePartial! .init-for-dynamic-pos widget-positions

    /*
    data = Ractive.parse ($ '#app' .html!)
    json = JSON.stringify data
    blob = new Blob([json], {type: "application/json"})
    url  = URL.createObjectURL(blob)

    a = document.createElement('a')
    a.download    = "backup.json"
    a.href        = url
    a.textContent = "Download backup.json"

    document.getElementById('selam').appendChild(a)
    console.log "child", a, "should be appended"

    url = 'data:text/json;charset=utf8,' + encodeURIComponent(json)
    window.open(url, '_blank');
    window.focus();

    if json == preparsed
      console.log "preparsed json is imported correctly"
    else
      console.log "preparsing is incorrect!", json.length, preparsed.length
    */

    set-timeout (->
      RactivePartial! .init-for-post-ready!
      # Update all I/O on init
      ), 1000ms




  console.log "ractive app completed..."

# ----------------------------------------------------
#             All test code goes below
# ----------------------------------------------------
require! {
  '../modules/aktos-dcs': {
    SwitchActor,
  }
}

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
    last,
    filter,
  }
}

RactivePartial!register ->
  #console.log "Testing sending data to table from app.ls"
  test = SwitchActor 'test-actor'
  test.send IoMessage:
    pin_name: \test-table
    table_data:
      <[ a b c d e ]>
      <[ a1 b1 c1 d1 e1 ]>
      <[ a2 b2 c2 d2 e2 ]>

RactivePartial!register ->
  poll-gms = ->
    $.ajax do
      method: "GET"
      url: "gms/WebService1.asmx/GetRooms"
      data-type: 'json'
      success: (response) ->
        #console.log "got gms data..."
        app.set \gms, response

  poll-gms!
  set-interval poll-gms, 30_000ms


# test trello
RactivePartial!register-for-document-ready ->
  #console.log "Trello integration test..."

  authorized = false
  on-authorize = ->
    if Trello.authorized!
      authorized := true
      #console.log "trello authorization is successful"
      Trello.members.get "me", (member) ->
        app.set \trelloData.member, member

      Trello.get "members/me/boards", (boards) ->
        app.set \trelloData.boards, boards

        board-id = filter (.shortLink is 'xnRCqVHI'), boards .0.id
        get-cards = ->
          if authorized
            Trello.get "/boards/#{board-id}/cards", (cards) ->
              #console.log "getting cards for board #{board-id}"
              app.set 'trelloData.cards', cards
              actions = []
              for i in cards
                Trello.get "/cards/#{i.id}/actions", (a) ->
                  actions.push a
                  if actions.length is cards.length
                    app.set \trelloData.card_actions, actions
                    app.set \trelloData.card_comments, [i.data.text for action in actions for i in action when i?.type is \commentCard ]
                    #console.log actions

              set-timeout get-cards, 12000ms

        get-cards!



      #console.log "trello on-authorize is ended..."
    else
      console.log "BUG: trello test: on-authorize! is called before authorized!"

  # authorize
  #console.log "authorizing to trello silently..."
  trello-silent-login = ->
    Trello.authorize do
        interactive:false
        success: on-authorize

  trello-silent-login!


  #app.on \trello, actions
  app.on do
    trello_login: ->
      console.log "logging in to Trello"
      Trello.authorize do
        type: "popup"
        success: on-authorize
    trello_logout: ->
      console.log "disconnecting from Trello"
      Trello.deauthorize!
      authorized := false
      app.set \trelloData, null

RactivePartial!register ->
  menu =
    brand:
      name: 'aktos'
      icon: 'img/aktos-icon.png'
    links:
      * name: 'İşler'
        addr: '#/applications'
      * name: 'Ürünler'
        addr: '#/products'
      * name: 'Pcb'
        addr: '#/pcb'
      * name: 'Demo'
        addr: '#/demos'
      * name: 'İletişim'
        addr: '#/contact-page'

  app.set "page.menu", menu

RactivePartial!register ->
  projects =
    * label: 'Cici Meze'
      src: 'projects/cici-meze/proje-kapak.jpg'
      addr: '#/cici-meze'

    * label: 'Akhisar Atıksu Arıtma'
      src: 'projects/akhisar-atiksu/proje-kapak-2.jpg'
      addr: '#akhisar-atiksu'

    * label: 'Doğanbey Atıksu Arıtma'
      src: 'projects/doganbey-atiksu/proje-kapak-2.jpg'
      addr: '#doganbey-atiksu'

    * label: 'Delphi Otomotiv (İzmir)'
      src: 'projects/delphi-kablo-zirhi-soyma/proje-kapak-2.png'
      addr: '#delphi-otomotiv-izmir'

    * label: 'HMS Üretim Takip'
      src: 'projects/hms-telemetri/proje-kapak-2.jpg'

    * label: 'İski Terfi İstasyonu'
      src: 'projects/iski/scada.jpg'

    * label: 'Newtech Cep Otomatı'
      src: 'projects/lintek-newtech-cep-otomati/proje-kapak-2.jpg'

    * src: 'projects/versis-asfalt-plenti/proje-kapak.jpg'
      label: 'Versis Asfalt Plenti'

    * label: 'Serel Seramik Üretim Takip'
      src: 'projects/serel/proje-kapak-2.jpg'

    * label: 'Gama-Gama Korelasyon Deney Otomasyonu'
      src: 'projects/kku-nukleer-fizik-lab/proje-kapak.jpg'

  app.set \page.projects, projects

RactivePartial!register ->
  home =
    about-us:
      header: \Hakkımızda
      body-short: """
        Aktos Elektronik, IoT (internet of things) sistemleri kurarken ihtiyaç duyduğu yazılım ve donanımları kendisi üretir.
        Tasarlamakta ve yönetmekte güçlük çekilen büyüklüklerdeki dağınık/karmaşık projeleri hedefler.
        Ürettiği yazılımları açık kaynak kodlu olarak paylaşır. Müşteriye özel tasarım yapar. İyi günler diler.
        """

      body-rest: """
        """
    news:
      * target-date: "13.09.2015"
        header: "İzmirHS Dağınık Programlama Eğitimi"
        body-short: """
          Kurucularından olduğumuz İzmir Hackerspace'de Dağınık
          programlama eğitimi verildi.
          """

      * target-date: "25.09.2015"
        header: "DEÜ Dağınık Programlama Eğitimi"
        body-short: """
          9 Eylül Üniversitesi'nde;

          * dağınık programlama
          * paralel programlama
          * realtime web arayüzü hazırlanması

          konularında eğitim verilecektir. Katılım için kayıt:
          info@aktos.io

          """

  app.set \page.home, home


RactivePartial!register ->
  products =
    * label: 'aktos-dcs'
      src: 'projects/aktos-dcs/aktos-dcs-logo-1.1.png'
      short-desc: """
        Otomasyon ve telemetri sistemleri için yazılım altyapısı
        """
      addr: 'https://github.com/aktos-io'

    * label: 'aktos-ipc'
      src: 'projects/aktos-ipc/proje-kapak.jpg'
      short-desc: """
        Endüstriyel PC
        """

    * label: 'aktos-scada'
      src: 'projects/aktos-scada/widgets.png'
      short-desc: """
        aktos-dcs uyumlu sistemler için web tabanlı realtime scada uygulaması
        """
      addr: '#/demos'

    * label: 'dijital termometre'
      src: 'projects/dijital-termometre/proje-kapak.jpg'
      short-desc: """
        sıcaklık takip otomasyonları için endüstriyel dijital termometre
        """

    * label: 'elektrik sayacı okuyucu'
      src: 'projects/energy-meter-reader/kapak.jpg'

  /*
    * label: 'GSM Modem'
      src: 'projects/aktos-gsm-modem/proje-kapak.jpg'

    * label: 'aktos-hmi'
      src: 'projects/aktos-hmi/tesis-ustten.jpg'
      short-desc: """
        Endüstriyel HMI ürünleri
        """
    */

  app.set \page.products, products

RactivePartial!register ->
  pcb =
    * label: 'Stm32-dev'
      src: 'projects/pcb/stm-dev/stm-dev.jpg'

    * label: 'Raspberry-Hat'
      src: 'projects/pcb/rpi-head/rpi-head.jpg'

    * label: 'Stm32F0-dev'
      src: 'projects/pcb/stm-f0-dev/stm-f0-dev.jpg'

    * label: 'RS232-to-UART'
      src: 'projects/pcb/rs232-to-uart/rs232-to-uart.jpg'

    * label: 'Remote Controller'
      src: 'projects/pcb/remote-control/remote-control.jpg'

    * label: 'Industrial Output Module'
      src: 'projects/pcb/output-module/output-module.jpg'

    * label: 'Dot-Matrix Controller'
      src: 'projects/pcb/dot-matrix/dot-matrix.jpg'

    * label: 'ESP-8266-dev'
      src: 'projects/pcb/esp8266-dev/esp8266-dev.jpg'

    * label: 'Slave-Bus Converter'
      src: 'projects/pcb/slave-bus/slave-bus.jpg'

  app.set \page.pcb, pcb

  /*

  console.log "Performance testing via gauge-slider pin"

  test2 = SwitchActor \gauge-slider

  i = 0
  j = +1
  up = ->
    test2.gui-event i
    #app.set \abc, i
    if i >= 100
      j := -1
    if i <= 0
      j := +1
    i := i + j
    set-timeout up, 1000

  set-timeout up, 2000

  test3 = SwitchActor \gauge-slider2

  k = 0
  l = +1
  up2 = ->
    test3.gui-event k
    #app.set \abc, k
    if k >= 100
      l := -1
    if k <= 0
      l := +1
    k := k + l
    set-timeout up2, 1000

  set-timeout up2, 2000

  */
