// version: 2015-02-21
    /**
    * o--------------------------------------------------------------------------------o
    * | This file is part of the RGraph package - you can learn more at:               |
    * |                                                                                |
    * |                          http://www.rgraph.net                                 |
    * |                                                                                |
    * | This package is licensed under the Creative Commons BY-NC license. That means  |
    * | that for non-commercial purposes it's free to use and for business use there's |
    * | a 99 GBP per-company fee to pay. You can read the full license here:           |
    * |                                                                                |
    * |                      http://www.rgraph.net/license                             |
    * o--------------------------------------------------------------------------------o
    */

    RGraph = window.RGraph || {isRGraph: true};

// Module pattern
(function (win, doc, undefined)
{
    var RG  = RGraph,
        ua  = navigator.userAgent,
        ma  = Math;




    /**
    * This installs some event handlers
    * 
    * Checking the RGraph.Annotate flag means the annotate code only runs once
    */
    RG.Annotating_canvas_onmousedown = function (e)
    {
        if (e.button === 0) {

            e.target.__object__.Set('chart.mousedown', true);

            // Get the object from the canvas. Annotating must be enabled on the
            // last object defined
            var obj = e.target.__object__;

            // This starts the annotating "path" and set the color
            obj.context.beginPath();

                obj.context.strokeStyle = obj.Get('chart.annotate.color');
                obj.context.lineWidth = obj.Get('chart.annotate.linewidth');

                var mouseXY = RG.getMouseXY(e);
                var mouseX  = mouseXY[0];
                var mouseY  = mouseXY[1];
            
                // Clear the annotation recording
                RG.Registry.Set('annotate.actions', [obj.Get('chart.annotate.color')]);
    
                // This sets the initial X/Y position
                obj.context.moveTo(mouseX, mouseY);
                RG.Registry.Set('annotate.last.coordinates', [mouseX,mouseY]);
                
                RG.Registry.Set('started.annotating', false);
                RG.Registry.Set('chart.annotating', obj);

                // Fire the onannotatebegin event.
                RG.FireCustomEvent(obj, 'onannotatebegin');
        }
        
        return false;
    };




    /**
    * This cancels annotating for ALL canvases
    */
    RG.Annotating_window_onmouseup = function (e)
    {
        var obj  = RG.Registry.Get('chart.annotating');

        if (e.button != 0 || !obj) {
            return;
        }
        
        // This cancels annotating on ALL canvas tags on the page
        var tags = doc.getElementsByTagName('canvas');

        for (var i=0; i<tags.length; ++i) {
            if (tags[i].__object__) {
                tags[i].__object__.Set('chart.mousedown', false);
            }
        }

        // Store the annotations in browser storage if it's available
        if (RG.Registry.Get('annotate.actions') && RG.Registry.Get('annotate.actions').length > 0 && win.localStorage) {

            var id = '__rgraph_annotations_' + e.target.id + '__';
            var annotations  = win.localStorage[id] ? win.localStorage[id] + '|' : '';
                annotations += RG.Registry.Get('annotate.actions');

            // Store the annotations information in HTML5 browser storage here
            win.localStorage[id] = annotations;
        }
        
        // Clear the recorded annotations
        RG.Registry.Set('annotate.actions', []);
        
        // Fire the annotate event
        RG.FireCustomEvent(obj, 'onannotateend');
    };




    /**
    * The canvas onmousemove function
    */
    RGraph.Annotating_canvas_onmousemove = function (e)
    {
        var obj     = e.target.__object__;
        var mouseXY = RGraph.getMouseXY(e);
        var mouseX  = mouseXY[0];
        var mouseY  = mouseXY[1];
        var lastXY = RG.Registry.Get('annotate.last.coordinates');

        if (obj.Get('chart.mousedown')) {
            
            obj.context.beginPath();
            
            if (!lastXY) {
                obj.context.moveTo(mouseX, mouseY)
            } else {
                obj.context.strokeStyle = obj.properties['chart.annotate.color'];
                obj.context.moveTo(lastXY[0], lastXY[1]);
                obj.context.lineTo(mouseX, mouseY);
            }

            RG.Registry.Set('annotate.actions', RG.Registry.Get('annotate.actions') + '|' + mouseX + ',' + mouseY);
            RG.Registry.Set('annotate.last.coordinates', [mouseX,mouseY]);

            RG.FireCustomEvent(obj, 'onannotate');
            obj.context.stroke();
        }
    };




    /**
    * Shows the mini palette used for annotations
    * 
    * @param object e The event object
    */
    RG.ShowPalette =
    RG.Showpalette = function (e)
    {
        var isSafari = navigator.userAgent.indexOf('Safari') ? true : false;

        e = RG.FixEventObject(e);

        var canvas  = e.target.parentNode.__canvas__;
        var context = canvas.getContext('2d');
        var obj     = canvas.__object__;
        var div     = document.createElement('DIV');
        var coords  = RG.getMouseXY(e);
        
        div.__object__               = obj; // The graph object
        div.className                = 'RGraph_palette';
        div.style.position           = 'absolute';
        div.style.backgroundColor    = 'white';
        div.style.border             = '1px solid black';
        div.style.left               = 0;
        div.style.top                = 0;
        div.style.padding            = '3px';
        div.style.opacity            = 0;
        div.style.boxShadow          = 'rgba(96,96,96,0.5) 3px 3px 3px';
        div.style.WebkitBoxShadow    = 'rgba(96,96,96,0.5) 3px 3px 3px';
        div.style.MozBoxShadow       = 'rgba(96,96,96,0.5) 3px 3px 3px';


        // MUST use named colors that are capitalised
        var colors = ['Black', 'Red', 'Yellow','Green','Orange', 'White', 'Magenta', 'Pink'];
        
        // Add the colors to the palette
        for (var i=0,len=colors.length; i<len; i+=1) {
            var div2 = doc.createElement('DIV');
                div2.cssClass = 'RGraph_palette_color';
                div2.style.fontSize = '12pt';
                div2.style.cursor = 'pointer';
                div2.style.padding = '1px';
                div2.style.paddingRight = '10px';
                
                var span = document.createElement('SPAN');
                    span.style.display = 'inline-block';
                    span.style.marginRight = '3px';
                    span.style.width = '17px';
                    span.style.height = '17px';
                    span.style.top = '2px';
                    span.style.position = 'relative';
                    span.style.backgroundColor = colors[i];
                div2.appendChild(span);
                
                div2.innerHTML += colors[i];
                

                div2.onmouseover = function ()
                {
                    this.style.backgroundColor = '#eee';
                }

                div2.onmouseout = function ()
                {
                    this.style.backgroundColor = '';
                }
                
                div2.onclick = function (e)
                {
                    var color = this.childNodes[0].style.backgroundColor;
                    
                    obj.Set('chart.annotate.color', color);
                }
            div.appendChild(div2);
        }


        doc.body.appendChild(div);

        /**
        * Now the div has been added to the document, move it up and left
        */
        div.style.left   = e.pageX + 'px';
        div.style.top    = e.pageY + 'px';
        
        /**
        * Chang the position if the cursor is near the right edge of the browser window
        */
        if ((e.pageX + (div.offsetWidth + 5) ) > document.body.offsetWidth) {
            div.style.left   = (e.pageX - div.offsetWidth) + 'px';
        }

        /**
        * Store the palette div in the registry
        */
        RGraph.Registry.Set('palette', div);
        
        setTimeout(function () {RG.Registry.Get('palette').style.opacity = 0.2;}, 50);
        setTimeout(function () {RG.Registry.Get('palette').style.opacity = 0.4;}, 100);
        setTimeout(function () {RG.Registry.Get('palette').style.opacity = 0.6;}, 150);
        setTimeout(function () {RG.Registry.Get('palette').style.opacity = 0.8;}, 200);
        setTimeout(function () {RG.Registry.Get('palette').style.opacity = 1;}, 250);

        RGraph.HideContext();

        window.onclick = function ()
        {
            RG.hidePalette();
        }

        // Should this be here? Yes. This function is being used as an event handler.
        e.stopPropagation();
        return false;
    };




    /**
    * Clears any annotation data from global storage
    * 
    * @param object canvas The canvas tag object
    */
    RG.clearAnnotations =
    RG.ClearAnnotations = function (canvas)
    {
        /**
        * For BC the argument can also be the ID of the canvas
        */
        if (typeof canvas === 'string') {
            var id = canvas;
            canvas = doc.getElementById(id);
        } else {
            var id = canvas.id
        }

        var obj = canvas.__object__;

        if (win.localStorage && win.localStorage['__rgraph_annotations_' + id + '__'] && win.localStorage['__rgraph_annotations_' + id + '__'].length) {
            win.localStorage['__rgraph_annotations_' + id + '__'] = [];
            
            RGraph.FireCustomEvent(obj, 'onannotateclear');
        }
    };




    /**
    * Replays stored annotations
    * 
    * @param object obj The graph object
    */
    RG.replayAnnotations =
    RG.ReplayAnnotations = function (obj)
    {
        // Check for support
        if (!win.localStorage) {
            return;
        }

        var context     = obj.context;
        var annotations = win.localStorage['__rgraph_annotations_' + obj.id + '__'];
        var i, len, move, coords;

        context.beginPath();
        context.lineWidth = obj.Get('annotate.linewidth');

        if (annotations && annotations.length) {
            annotations = annotations.split('|');
        } else {
            return;
        }


        for (i=0,len=annotations.length; i<len; ++i) {

            // If the element of the array is a color - finish the path,
            // stroke it and start a new one
            if (annotations[i].match(/[a-z]+/)) {
                context.stroke();
                context.beginPath();

                context.strokeStyle = annotations[i];
                move = true;
                continue;
            }

            coords = annotations[i].split(',');
            coords[0] = Number(coords[0]);
            coords[1] = Number(coords[1]);

            if (move) {
                context.moveTo(coords[0], coords[1]);
                move = false;
            } else {
                context.lineTo(coords[0], coords[1]);
            }
        }
        
        context.stroke();
    };




    window.addEventListener('load', function (e)
    {
        // This delay is necessary to allow the window.onload event listener to run
        setTimeout(function ()
        {
            var tags = doc.getElementsByTagName('canvas');
            for (var i=0; i<tags.length; ++i) {
                if (tags[i].__object__ && tags[i].__object__.isRGraph && tags[i].__object__.Get('chart.annotatable')) {
                    RG.replayAnnotations(tags[i].__object__);
                }
            }
        }, 100); // This delay is sufficient to wait before replaying the annotations
    }, false);




// End module pattern
})(window, document);