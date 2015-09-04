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

    /**
    * The Fuel widget constructor
    * 
    * @param object canvas The canvas object
    * @param int min       The minimum value
    * @param int max       The maximum value
    * @param int value     The indicated value
    */
    RGraph.Fuel = function (conf)
    {
        /**
        * Allow for object config style
        */
        if (   typeof conf === 'object'
            && typeof conf.min === 'number'
            && typeof conf.max === 'number'
            && typeof conf.id === 'string') {

            var id                        = conf.id
            var canvas                    = document.getElementById(id);
            var min                       = conf.min;
            var max                       = conf.max;
            var value                     = conf.value;
            var parseConfObjectForOptions = true; // Set this so the config is parsed (at the end of the constructor)
        
        } else {
        
            var id     = conf;
            var canvas = document.getElementById(id);
            var min    = arguments[1];
            var max    = arguments[2];
            var value  = arguments[3];
        }

        // Get the canvas and context objects
        this.id                = id;
        this.canvas            = canvas;
        this.context           = this.canvas.getContext ? this.canvas.getContext("2d", {alpha: (typeof id === 'object' && id.alpha === false) ? false : true}) : null;
        this.canvas.__object__ = this;
        this.type              = 'fuel';
        this.isRGraph          = true;
        this.min               = min;
        this.max               = max;
        this.value             = RGraph.stringsToNumbers(value);
        this.angles            = {};
        this.currentValue      = null;
        this.uid               = RGraph.CreateUID();
        this.canvas.uid        = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();
        this.coordsText        = [];
        this.original_colors   = [];
        this.firstDraw         = true; // After the first draw this will be false


        /**
        * Compatibility with older browsers
        */
        //RGraph.OldBrowserCompat(this.context);


        // Check for support
        if (!this.canvas) {
            alert('[FUEL] No canvas support');
            return;
        }

        /**
        * The funnel charts properties
        */
        this.properties =
        {
            'chart.colors':                   ['Gradient(white:red)'],
            'chart.needle.color':             'red',
            'chart.gutter.left':              5,
            'chart.gutter.right':             5,
            'chart.gutter.top':               5,
            'chart.gutter.bottom':            5,
            'chart.text.size':                10,
            'chart.text.color':               'black', // Does not support gradients
            'chart.text.font':                'Arial',
            'chart.contextmenu':              null,
            'chart.annotatable':              false,
            'chart.annotate.color':           'black',
            'chart.zoom.factor':              1.5,
            'chart.zoom.fade.in':             true,
            'chart.zoom.fade.out':            true,
            'chart.zoom.factor':              1.5,
            'chart.zoom.fade.in':             true,
            'chart.zoom.fade.out':            true,
            'chart.zoom.hdir':                'right',
            'chart.zoom.vdir':                'down',
            'chart.zoom.frames':            25,
            'chart.zoom.delay':             16.666,
            'chart.zoom.shadow':              true,
            'chart.zoom.background':          true,
            'chart.zoom.action':              'zoom',
            'chart.adjustable':               false,
            'chart.resizable':                false,
            'chart.resize.handle.background': null,
	    'chart.icon':                     '',
            'chart.icon.redraw':              true,
            'chart.background.image.stretch': false,
            'chart.background.image.x':       null,
            'chart.background.image.y':       null,
            'chart.labels.full':              'F',
            'chart.labels.empty':             'E',
            'chart.labels.count':             5,
            'chart.centerx':                  null,
            'chart.centery':                  null,
            'chart.radius':                   null,
            'chart.scale.visible':            false,
            'chart.scale.decimals':           0,
            'chart.units.pre':                '',
            'chart.units.post':               ''
        }
        
        /**
        * Bounds checking - if the value is outside the scale
        */
        if (this.value > this.max) this.value = this.max;
        if (this.value < this.min) this.value = this.min;





        /*
        * Translate half a pixel for antialiasing purposes - but only if it hasn't beeen
        * done already
        */
        if (!this.canvas.__rgraph_aa_translated__) {
            this.context.translate(0.5,0.5);
            
            this.canvas.__rgraph_aa_translated__ = true;
        }



        // Short variable names
        var RG   = RGraph;
        var ca   = this.canvas;
        var co   = ca.getContext('2d');
        var prop = this.properties;
        var jq   = jQuery;
        var pa   = RG.Path;
        var win  = window;
        var doc  = document;
        var ma   = Math;
        
        
        
        /**
        * "Decorate" the object with the generic effects if the effects library has been included
        */
        if (RG.Effects && typeof RG.Effects.decorate === 'function') {
            RG.Effects.decorate(this);
        }


        /**
        * A setter
        * 
        * @param name  string The name of the property to set
        * @param value mixed  The value of the property
        */
        this.set =
        this.Set = function (name)
        {
            var value = typeof arguments[1] === 'undefined' ? null : arguments[1];

            /**
            * the number of arguments is only one and it's an
            * object - parse it for configuration data and return.
            */
            if (arguments.length === 1 && typeof name === 'object') {
                RG.parseObjectStyleConfig(this, name);
                return this;
            }




            name = name.toLowerCase();
    
            /**
            * This should be done first - prepend the propertyy name with "chart." if necessary
            */
            if (name.substr(0,6) != 'chart.') {
                name = 'chart.' + name;
            }
    
            prop[name] = value;
    
            return this;
        };




        /**
        * A getter
        * 
        * @param name  string The name of the property to get
        */
        this.get =
        this.Get = function (name)
        {
            /**
            * This should be done first - prepend the property name with "chart." if necessary
            */
            if (name.substr(0,6) != 'chart.') {
                name = 'chart.' + name;
            }
    
            return prop[name.toLowerCase()];
        };




        /**
        * The function you call to draw the bar chart
        */
        this.draw =
        this.Draw = function ()
        {
            /**
            * Fire the onbeforedraw event
            */
            RG.FireCustomEvent(this, 'onbeforedraw');
    
    
    
            /**
            * Set the current value
            */
            this.currentValue = this.value;
    
    
    
            /**
            * This is new in May 2011 and facilitates indiviual gutter settings,
            * eg chart.gutter.left
            */
            this.gutterLeft   = prop['chart.gutter.left'];
            this.gutterRight  = prop['chart.gutter.right'];
            this.gutterTop    = prop['chart.gutter.top'];
            this.gutterBottom = prop['chart.gutter.bottom'];
    
    
    
            /**
            * Get the center X and Y of the chart. This is the center of the needle bulb
            */
            this.centerx = ((ca.width - this.gutterLeft - this.gutterRight) / 2) + this.gutterLeft;
            this.centery = ca.height - 20 - this.gutterBottom
    
    
    
            /**
            * Work out the radius of the chart
            */
            this.radius = ca.height - this.gutterTop - this.gutterBottom - 20;
            
                        /**
            * Stop this growing uncntrollably
            */
            this.coordsText = [];
            
            
            
            /**
            * You can now specify chart.centerx, chart.centery and chart.radius
            */
            if (typeof(prop['chart.centerx']) == 'number') this.centerx = prop['chart.centerx'];
            if (typeof(prop['chart.centery']) == 'number') this.centery = prop['chart.centery'];
            if (typeof(prop['chart.radius']) == 'number')  this.radius  = prop['chart.radius'];
    
    
    
    
            /**
            * Parse the colors. This allows for simple gradient syntax
            */
            if (!this.colorsParsed) {
                this.parseColors();
                
                // Don't want to do this again
                this.colorsParsed = true;
            }
    
    
            /**
            * The start and end angles of the chart
            */
            this.angles.start  = (RG.PI + RG.HALFPI) - 0.5;
            this.angles.end    = (RG.PI + RG.HALFPI) + 0.5;
            this.angles.needle = this.getAngle(this.value);
    
    
    
            /**
            * Draw the labels on the chart
            */
            this.DrawLabels();
    
    
            /**
            * Draw the fuel guage
            */
            this.DrawChart();
    
    
    
            
            
            /**
            * Setup the context menu if required
            */
            if (prop['chart.contextmenu']) {
                RG.ShowContext(this);
            }
    
            
            /**
            * This function enables resizing
            */
            if (prop['chart.resizable']) {
                RG.AllowResizing(this);
            }
    
    
            /**
            * This installs the event listeners
            */
            RG.InstallEventListeners(this);
    
    

            /**
            * Fire the onfirstdraw event
            */
            if (this.firstDraw) {
                RG.fireCustomEvent(this, 'onfirstdraw');
                this.firstDraw = false;
                this.firstDrawFunc();
            }



            /**
            * Fire the RGraph ondraw event
            */
            RG.FireCustomEvent(this, 'ondraw');
            
            return this;
        };




        /**
        * This function actually draws the chart
        */
        this.drawChart =
        this.DrawChart = function ()
        {
            /**
            * Draw the "Scale"
            */
            this.DrawScale();
            
            /**
            * Place the icon on the canvas
            */
            if (!RG.ISOLD) {
                this.DrawIcon();
            }
    
    
    
            /**
            * Draw the needle
            */
            this.DrawNeedle();
        };




        /**
        * Draws the labels
        */
        this.drawLabels =
        this.DrawLabels = function ()
        {
            if (!prop['chart.scale.visible']) {
                var radius = (this.radius - 20);
                co.fillStyle = prop['chart.text.color'];
                
                // Draw the left label
                var y = this.centery - Math.sin(this.angles.start - RG.PI) * (this.radius - 25);
                var x = this.centerx - Math.cos(this.angles.start - RG.PI) * (this.radius - 25);
                RG.Text2(this, {'font':prop['chart.text.font'],
                                    'size':prop['chart.text.size'],
                                    'x':x,
                                    'y':y,
                                    'text':prop['chart.labels.empty'],
                                    'halign': 'center',
                                    'valign':'center',
                                    'tag': 'labels'
                                   });
                
                // Draw the right label
                var y = this.centery - Math.sin(this.angles.start - RG.PI) * (this.radius - 25);
                var x = this.centerx + Math.cos(this.angles.start - RG.PI) * (this.radius - 25);
                RG.Text2(this, {'font':prop['chart.text.font'],
                                    'size':prop['chart.text.size'],
                                    'x':x,
                                    'y':y,
                                    'text':prop['chart.labels.full'],
                                    'halign': 'center',
                                    'valign':'center',
                                    'tag': 'labels'
                                   });
            }
        };




    
        /**
        * Draws the needle
        */
        this.drawNeedle =
        this.DrawNeedle = function ()
        {
            // Draw the actual needle
            co.beginPath();
                co.lineWidth = 5;
                co.lineCap = 'round';
                co.strokeStyle = prop['chart.needle.color'];
    
                /**
                * The angle for the needle
                */
                var angle = this.angles.needle;
    
                co.arc(this.centerx, this.centery, this.radius - 30, angle, angle + 0.0001, false);
                co.lineTo(this.centerx, this.centery);
            co.stroke();
            
            co.lineWidth = 1;
    
            // Create the gradient for the bulb
            var cx   = this.centerx + 10;
            var cy   = this.centery - 10
    
            var grad = co.createRadialGradient(cx, cy, 35, cx, cy, 0);
            grad.addColorStop(0, 'black');
            grad.addColorStop(1, '#eee');
    
            if (navigator.userAgent.indexOf('Firefox/6.0') > 0) {
                grad = co.createLinearGradient(cx + 10, cy - 10, cx - 10, cy + 10);
                grad.addColorStop(1, '#666');
                grad.addColorStop(0.5, '#ccc');
            }
    
            // Draw the bulb
            co.beginPath();
                co.fillStyle = grad;
                co.moveTo(this.centerx, this.centery);
                co.arc(this.centerx, this.centery, 20, 0, RG.TWOPI, 0);
            co.fill();
        };
    
        
        /**
        * Draws the "scale"
        */
        this.drawScale =
        this.DrawScale = function ()
        {
            var a, x, y;
    
            //First draw the fill background
            co.beginPath();
                co.strokeStyle = 'black';
                co.fillStyle = 'white';
                co.arc(this.centerx, this.centery, this.radius, this.angles.start, this.angles.end, false);
                co.arc(this.centerx, this.centery, this.radius - 10, this.angles.end, this.angles.start, true);
            co.closePath();
            co.stroke();
            co.fill();
    
            //First draw the fill itself
            var start = this.angles.start;
            var end   = this.angles.needle;
    
            co.beginPath();
                co.fillStyle = prop['chart.colors'][0];
                co.arc(this.centerx, this.centery, this.radius, start, end, false);
                co.arc(this.centerx, this.centery, this.radius - 10, end, start, true);
            co.closePath();
            //co.stroke();
            co.fill();
            
            // This draws the tickmarks
            for (a = this.angles.start; a<=this.angles.end+0.01; a+=((this.angles.end - this.angles.start) / 5)) {
                co.beginPath();
                    co.arc(this.centerx, this.centery, this.radius - 10, a, a + 0.0001, false);
                    co.arc(this.centerx, this.centery, this.radius - 15, a + 0.0001, a, true);
                co.stroke();
            }
            
            /**
            * If chart.scale.visible is specified draw the textual scale
            */
            if (prop['chart.scale.visible']) {
    
                co.fillStyle = prop['chart.text.color'];
    
                // The labels
                var numLabels  = prop['chart.labels.count'];
                var decimals   = prop['chart.scale.decimals'];
                var font       = prop['chart.text.font'];
                var size       = prop['chart.text.size'];
                var units_post = prop['chart.units.post'];
                var units_pre  = prop['chart.units.pre'];
    
                for (var i=0; i<=numLabels; ++i) {
                    a = ((this.angles.end - this.angles.start) * (i/numLabels)) + this.angles.start;
                    y = this.centery - Math.sin(a - RG.PI) * (this.radius - 25);
                    x = this.centerx - Math.cos(a - RG.PI) * (this.radius - 25);
                    
                    
                    RG.Text2(this, {'font':font,
                                        'size':size,
                                        'x':x,
                                        'y':y,
                                        'text': RG.number_format(this, (this.min + ((this.max - this.min) * (i/numLabels))).toFixed(decimals),units_pre,units_post),
                                        'halign': 'center',
                                        'valign':'center',
                                        'tag': 'scale'
                                       });
                }
            }
        };




        /**
        * A placeholder function that is here to prevent errors
        */
        this.getShape = function (e) {};




        /**
        * This function returns the pertinent value based on a click
        * 
        * @param  object e An event object
        * @return number   The relevant value at the point of click
        */
        this.getValue = function (e)
        {
            var mouseXY = RG.getMouseXY(e);
            var angle   = RG.getAngleByXY(this.centerx, this.centery, mouseXY[0], mouseXY[1]);
    
            /**
            * Boundary checking
            */
            if (angle >= this.angles.end) {
                return this.max;
            } else if (angle <= this.angles.start) {
                return this.min;
            }
    
            var value = (angle - this.angles.start) / (this.angles.end - this.angles.start);
                value = value * (this.max - this.min);
                value = value + this.min;
    
            return value;
        };




        /**
        * The getObjectByXY() worker method. Don't call this call:
        * 
        * RG.ObjectRegistry.getObjectByXY(e)
        * 
        * @param object e The event object
        */
        this.getObjectByXY = function (e)
        {
            var mouseXY  = RG.getMouseXY(e);
            var angle    = RG.getAngleByXY(this.centerx, this.centery, mouseXY[0], mouseXY[1]);
            var accuracy = 15;

            var leftMin   = this.centerx - this.radius;
            var rightMax  = this.centerx + this.radius;
            var topMin    = this.centery - this.radius;
            var bottomMax = this.centery + this.radius;
    
            if (
                   mouseXY[0] > leftMin
                && mouseXY[0] < rightMax
                && mouseXY[1] > topMin
                && mouseXY[1] < bottomMax
                ) {
    
                return this;
            }
        };




        /**
        * Draws the icon
        */
        this.drawIcon =
        this.DrawIcon = function ()
        {
            if (!RG.ISOLD) {
                
                if (!this.__icon__ || !this.__icon__.__loaded__) {
                    var img = new Image();
                    img.src = prop[''];
                    img.__object__ = this;
                    this.__icon__ = img;
                
                
                    img.onload = function (e)
                    {
                        img.__loaded__ = true;
                        var obj = img.__object__;
                        //var co  = obj.context;
                        //var prop = obj.properties;
                    
                        co.drawImage(img,obj.centerx - (img.width / 2), obj.centery - obj.radius + 35);
        
                        obj.DrawNeedle();
        
                        if (prop['chart.icon.redraw']) {
                            obj.Set('chart.icon.redraw', false);
                            RG.Clear(obj.canvas);
                            RG.RedrawCanvas(ca);
                        }
                    }
                } else {
                    var img = this.__icon__;
                    co.drawImage(img,this.centerx - (img.width / 2), this.centery - this.radius + 35);
                }
            }
    
            this.DrawNeedle();
        };




        /**
        * This method handles the adjusting calculation for when the mouse is moved
        * 
        * @param object e The event object
        */
        this.adjusting_mousemove =
        this.Adjusting_mousemove = function (e)
        {
            /**
            * Handle adjusting for the Fuel gauge
            */
            if (prop['chart.adjustable'] && RG.Registry.Get('chart.adjusting') && RG.Registry.Get('chart.adjusting').uid == this.uid) {
                this.value = this.getValue(e);
                //RG.Clear(ca);
                RG.redrawCanvas(ca);
                RG.fireCustomEvent(this, 'onadjust');
            }
        };




        /**
        * This method gives you the relevant angle (in radians) that a particular value is
        * 
        * @param number value The relevant angle
        */
        this.getAngle = function (value)
        {
            // Range checking
            if (value < this.min || value > this.max) {
                return null;
            }
    
            var angle = (((value - this.min) / (this.max - this.min)) * (this.angles.end - this.angles.start)) + this.angles.start;
    
            return angle;
        };




        /**
        * This allows for easy specification of gradients
        */
        this.parseColors = function ()
        {
            // Save the original colors so that they can be restored when the canvas is reset
            if (this.original_colors.length === 0) {
                this.original_colors['chart.colors']       = RG.array_clone(prop['chart.colors']);
                this.original_colors['chart.needle.color'] = RG.array_clone(prop['chart.needle.color']);
            }

            var props  = this.properties;
            var colors = props['chart.colors'];
    
            for (var i=0; i<colors.length; ++i) {
                colors[i] = this.parseSingleColorForLinearGradient(colors[i]);
            }
            
            props['chart.needle.color'] = this.parseSingleColorForRadialGradient(props['chart.needle.color']);
        };




        /**
        * Use this function to reset the object to the post-constructor state. Eg reset colors if
        * need be etc
        */
        this.reset = function ()
        {
        };




        /**
        * This parses a single color value
        */
        this.parseSingleColorForLinearGradient = function (color)
        {
            if (!color || typeof(color) != 'string') {
                return color;
            }
    
            if (color.match(/^gradient\((.*)\)$/i)) {
                
                var parts = RegExp.$1.split(':');
    
                // Create the gradient
                var grad = co.createLinearGradient(prop['chart.gutter.left'],0,ca.width - prop['chart.gutter.right'],0);
    
                var diff = 1 / (parts.length - 1);
    
                grad.addColorStop(0, RG.trim(parts[0]));
    
                for (var j=1; j<parts.length; ++j) {
                    grad.addColorStop(j * diff, RG.trim(parts[j]));
                }
            }
                
            return grad ? grad : color;
        };




        /**
        * This parses a single color value
        */
        this.parseSingleColorForRadialGradient = function (color)
        {
            if (!color || typeof color != 'string') {
                return color;
            }
    
            if (color.match(/^gradient\((.*)\)$/i)) {
                
                var parts = RegExp.$1.split(':');
    
                // Create the gradient
                var grad = co.createRadialGradient(this.centerx, this.centery, 0, this.centerx, this.centery, this.radius);
    
                var diff = 1 / (parts.length - 1);
    
                grad.addColorStop(0, RG.trim(parts[0]));
    
                for (var j=1; j<parts.length; ++j) {
                    grad.addColorStop(j * diff, RG.trim(parts[j]));
                }
            }
                
            return grad ? grad : color;
        };




        /**
        * Using a function to add events makes it easier to facilitate method chaining
        * 
        * @param string   type The type of even to add
        * @param function func 
        */
        this.on = function (type, func)
        {
            if (type.substr(0,2) !== 'on') {
                type = 'on' + type;
            }
            
            this[type] = func;
    
            return this;
        };




        /**
        * This function runs once only
        * (put at the end of the file (before any effects))
        */
        this.firstDrawFunc = function ()
        {
        };




        /**
        * Grow
        * 
        * The Fuel chart Grow effect gradually increases the values of the Fuel chart
        * 
        * @param object obj The graph object
        */
        this.grow = function ()
        {
            var callback  = arguments[1] || function () {};
            var opt       = arguments[0] || {};
            var numFrames = opt.frames || 30;
            var frame     = 0;
            var obj       = this;
            var origValue = Number(this.currentValue);
            
            if (this.currentValue == null) {
                this.currentValue = this.min;
                origValue = this.min;
            }
    
            var newValue  = this.value;
            var diff      = newValue - origValue;
            var step      = (diff / numFrames);
            var frame     = 0;
    
    
            function iterator ()
            {
                frame++;
    
                obj.value = ((frame / numFrames) * diff) + origValue
    
                if (obj.value > obj.max) obj.value = obj.max;
                if (obj.value < obj.min) obj.value = obj.min;
    
                RGraph.clear(obj.canvas);
                RGraph.redrawCanvas(obj.canvas);
    
                if (frame < numFrames) {
                    RGraph.Effects.updateCanvas(iterator);
                
                // The callback variable is always function
                } else  {
                    callback(obj);
                }
            }
    
            iterator();
            
            return this;
        };
    
    
    

        /**
        * Now need to register all chart types. MUST be after the setters/getters are defined
        * 
        * *** MUST BE LAST IN THE CONSTRUCTOR ***
        */
        RG.Register(this);




        /**
        * This is the 'end' of the constructor so if the first argument
        * contains configuration data - handle that.
        */
        if (parseConfObjectForOptions) {
            RG.parseObjectStyleConfig(this, conf.options);
        }
    };