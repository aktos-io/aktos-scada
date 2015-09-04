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
    
    /**
    * Having this here means that the RGraph libraries can be included in any order, instead of you having
    * to include the common core library first.
    */

    // Define the RGraph global variable
    RGraph = window.RGraph || {isRGraph: true};
    RGraph.Drawing = RGraph.Drawing || {};

    /**
    * The constructor. This function sets up the object. It takes the ID (the HTML attribute) of the canvas as the
    * first argument and the data as the second. If you need to change this, you can.
    * 
    * @param string id    The canvas tag ID
    * @param number x    The X position of the label
    * @param number y    The Y position of the label
    * @param number text The text used
    */
    RGraph.Drawing.Marker2 = function (conf)
    {
        /**
        * Allow for object config style
        */
        if (   typeof conf === 'object'
            && typeof conf.x === 'number'
            && typeof conf.y === 'number'
            && typeof conf.id === 'string'
            && typeof conf.text === 'string') {

            var id                        = conf.id
            var canvas                    = document.getElementById(id);
            var x                         = conf.x;
            var y                         = conf.y;
            var text                      = conf.text;
            
            var parseConfObjectForOptions = true; // Set this so the config is parsed (at the end of the constructor)
        
        } else {
        
            var id     = conf;
            var canvas = document.getElementById(id);
            var x      = arguments[1];
            var y      = arguments[2];
            var text   = arguments[3];
        }




        this.id                = id;
        this.canvas            = document.getElementById(this.id);
        this.context           = this.canvas.getContext('2d')
        this.colorsParsed      = false;
        this.canvas.__object__ = this;
        this.original_colors   = [];
        this.firstDraw         = true; // After the first draw this will be false


        /**
        * Store the properties
        */
        this.x    = x;
        this.y    = y;
        this.text = text;


        /**
        * This defines the type of this shape
        */
        this.type = 'drawing.marker2';


        /**
        * This facilitates easy object identification, and should always be true
        */
        this.isRGraph = true;


        /**
        * This adds a uid to the object that you can use for identification purposes
        */
        this.uid = RGraph.CreateUID();


        /**
        * This adds a UID to the canvas for identification purposes
        */
        this.canvas.uid = this.canvas.uid ? this.canvas.uid : RGraph.CreateUID();


        /**
        * Some example background properties
        */
        this.properties =
        {
            'chart.strokestyle':        'black',
            'chart.fillstyle':          'white',
            'chart.text.color':         'black',
            'chart.text.size':          12,
            'chart.text.font':          'Arial',
            'chart.events.click':       null,
            'chart.events.mousemove':   null,
            'chart.shadow':             true,
            'chart.shadow.color':       'gray',
            'chart.shadow.offsetx':     3,
            'chart.shadow.offsety':     3,
            'chart.shadow.blur':        5,
            'chart.highlight.stroke':   'rgba(0,0,0,0)',
            'chart.highlight.fill':     'rgba(255,255,255,0.7)',
            'chart.tooltips':           null,
            'chart.tooltips.highlight': true,
            'chart.tooltips.event':     'onclick',
            'chart.voffset':            20
        }

        /**
        * A simple check that the browser has canvas support
        */
        if (!this.canvas) {
            alert('[DRAWING.MARKER2] No canvas support');
            return;
        }
        
        /**
        * These are used to store coords
        */
        this.coords = [];
        this.coordsText = [];


        /**
        * Create the dollar object so that functions can be added to them
        */
        this.$0 = {};


        /**
        * Translate half a pixel for antialiasing purposes - but only if it hasn't beeen
        * done already
        */
        if (!this.canvas.__rgraph_aa_translated__) {
            this.context.translate(0.5,0.5);
            
            this.canvas.__rgraph_aa_translated__ = true;
        }




        // Short variable names
        var RG    = RGraph;
        var ca    = this.canvas;
        var co    = ca.getContext('2d');
        var prop  = this.properties;
        var jq    = jQuery;
        var pa    = RG.Path;
        var win   = window;
        var doc   = document;
        var ma    = Math;
        
        
        
        /**
        * "Decorate" the object with the generic effects if the effects library has been included
        */
        if (RG.Effects && typeof RG.Effects.decorate === 'function') {
            RG.Effects.decorate(this);
        }




        /**
        * A setter method for setting graph properties. It can be used like this: obj.Set('chart.strokestyle', '#666');
        * 

        * @param name  string The name of the property to set OR it can be a map
        *                     of name/value settings like what you set in the constructor
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
        * A getter method for retrieving graph properties. It can be used like this: obj.Get('chart.strokestyle');
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
        * Draws the marker
        */
        this.draw =
        this.Draw = function ()
        {
            /**
            * Reset the linewidth
            */
            co.lineWidth = 1;

            /**
            * Fire the onbeforedraw event
            */
            RG.FireCustomEvent(this, 'onbeforedraw');
    

            this.metrics = RG.MeasureText(this.text, prop['chart.text.bold'], prop['chart.text.font'], prop['chart.text.size']);



            if (this.x + this.metrics[0] >= ca.width) {
                this.alignRight = true;
            }




            /**
            * Parse the colors. This allows for simple gradient syntax
            */
            if (!this.colorsParsed) {
    
                this.parseColors();
    
                // Don't want to do this again
                this.colorsParsed = true;
            }




            /***************
            * Draw the box *
            ****************/

            var x      = this.alignRight ? this.x - this.metrics[0] - 6 : this.x;
            var y      = this.y - 6 - prop['chart.voffset'] - this.metrics[1];
            var width  = this.metrics[0] + 6;
            var height = this.metrics[1] + 6;
            
            // Store these coords as the coords of the label
            this.coords[0] = [x, y, width, height];
            
            
            
            /**
            * Stop this growing uncntrollably
            */
            this.coordsText = [];
            
            
            // Set the linewidth
            co.lineWidth = prop['chart.linewidth'];

            
            
            
            
            /**
            * Draw the box that the text sits in
            */
            
            if (prop['chart.shadow']) {
                RG.SetShadow(this, prop['chart.shadow.color'], prop['chart.shadow.offsetx'], prop['chart.shadow.offsety'], prop['chart.shadow.blur']);
            }
            co.strokeStyle = prop['chart.strokestyle'];
            co.fillStyle = prop['chart.fillstyle'];
            
            // This partcular strokeRect has 0 width and so ends up being a line
            co.strokeRect(x + (this.alignRight ? width : 0), y, 0, height + prop['chart.voffset'] - 6);

            co.strokeRect(x, y, width, height);
            co.fillRect(x, y, width, height);
            
            RG.NoShadow(this);
            
            co.fillStyle = prop['chart.text.color'];

            // Draw the text
            RG.Text2(this, {'font':prop['chart.text.font'],
                                'size':prop['chart.text.size'],
                                'x': Math.round(this.x) - (this.alignRight ? this.metrics[0] + 3 : -3),
                                'y':this.y - 3 - prop['chart.voffset'],
                                'text':this.text,
                                'valign':'bottom',
                                'halign':'left',
                                'tag': 'labels'
                               });
            
            this.coords[0].push([x, y, width, height]);







            
            // Must turn the shadow off
            RG.NoShadow(this);
    
    
    
            /**
            * Reset the testBaseline
            */
            co.textBaseline = 'alphabetic';
    
    
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
            * Fire the ondraw event
            */
            RG.FireCustomEvent(this, 'ondraw');
            
            return this;
        };




        /**
        * The getObjectByXY() worker method
        */
        this.getObjectByXY = function (e)
        {
            var mouseXY = RG.getMouseXY(e);
    
            if (this.getShape(e)) {
                return this;
            }
        };




        /**
        * Not used by the class during creating the shape, but is used by event handlers
        * to get the coordinates (if any) of the selected bar
        * 
        * @param object e The event object
        * @param object   OPTIONAL You can pass in the bar object instead of the
        *                          function using "this"
        */
        this.getShape = function (e)
        {
            var mouseXY = RG.getMouseXY(e);
            var mouseX  = mouseXY[0];
            var mouseY  = mouseXY[1];
    
            if (   mouseX >= this.coords[0][0] && mouseX <= (this.coords[0][0] + this.coords[0][2]) ) {

                if (mouseY >= this.coords[0][1] && mouseY <= (this.coords[0][1] + this.coords[0][3])) {
    
                    return {
                            0: this, 1: this.coords[0][0], 2: this.coords[0][1], 3: this.coords[0][2], 4: this.coords[0][3], 5: 0,
                            'object': this, 'x': this.coords[0][0], 'y': this.coords[0][1], 'width': this.coords[0][2], 'height': this.coords[0][3], 'index': 0, 'tooltip': prop['chart.tooltips'] ? prop['chart.tooltips'][0] : null
                           };
                }
            }
            
            return null;
        };




        /**
        * This function positions a tooltip when it is displayed
        * 
        * @param obj object     The chart object
        * @param int x          The X coordinate specified for the tooltip
        * @param int y          The Y coordinate specified for the tooltip
        * @param object tooltip The tooltips DIV element
        * @param number idx     The index of the tooltip
        */
        this.positionTooltip = function (obj, x, y, tooltip, idx)
        {
            var textDimensions = RG.MeasureText(this.text, false, prop['chart.text.font'], prop['chart.text.size']);
    
            var canvasXY   = RG.getCanvasXY(obj.canvas);
            var width      = tooltip.offsetWidth;
            var height     = tooltip.offsetHeight;
    
            // Set the top position
            tooltip.style.left = 0;
            tooltip.style.top  = canvasXY[1] + this.coords[0][1] - height - 9 + (this.coords[0][3] / 2) + 'px';

            // By default any overflow is hidden
            tooltip.style.overflow = '';
    
            // The arrow
            var img = new Image();
                img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAFCAYAAACjKgd3AAAARUlEQVQYV2NkQAN79+797+RkhC4M5+/bd47B2dmZEVkBCgcmgcsgbAaA9GA1BCSBbhAuA/AagmwQPgMIGgIzCD0M0AMMAEFVIAa6UQgcAAAAAElFTkSuQmCC';
                img.style.position = 'absolute';
                img.id = '__rgraph_tooltip_pointer__';
                img.style.top = (tooltip.offsetHeight - 2) + 'px';
            tooltip.appendChild(img);
            
            // Reposition the tooltip if at the edges:
            
            // LEFT edge
            if ((canvasXY[0] + obj.coords[0][0] + (obj.coords[0][2] / 2) - (width / 2)) < 10) {
                tooltip.style.left = (canvasXY[0] + this.coords[0][0] + (this.coords[0][2] / 2) - (width * 0.1)) + 'px';
                img.style.left = ((width * 0.1) - 8.5) + 'px';
    
            // RIGHT edge
            } else if ((canvasXY[0] + this.coords[0][0] + (this.coords[0][2] / 2) + (width / 2)) > doc.body.offsetWidth) {
                tooltip.style.left = (canvasXY[0] + this.coords[0][0] + (this.coords[0][2] / 2) - (width * 0.9)) + 'px';
                img.style.left = ((width * 0.9) - 8.5) + 'px';
    
            // Default positioning - CENTERED
            } else {
                tooltip.style.left = (canvasXY[0] + this.coords[0][0] + (this.coords[0][2] / 2) - (width * 0.5)) + 'px';
                img.style.left = ((width * 0.5) - 8.5) + 'px';
            }
        };




        /**
        * Each object type has its own Highlight() function which highlights the appropriate shape
        * 
        * @param object shape The shape to highlight
        */
        this.highlight =
        this.Highlight = function (shape)
        {
            if (prop['chart.tooltips.highlight']) {
                pa(this, ['b','r',this.coords[0][0],this.coords[0][1],this.coords[0][2],this.coords[0][3],'f',prop['chart.highlight.fill'],'s',prop['chart.highlight.stroke']]);
            }
        };




        /**
        * This allows for easy specification of gradients
        */
        this.parseColors = function ()
        {
            // Save the original colors so that they can be restored when the canvas is reset
            if (this.original_colors.length === 0) {
                this.original_colors['chart.fillstyle']        = RG.array_clone(prop['chart.fillstyle']);
                this.original_colors['chart.strokestyle']      = RG.array_clone(prop['chart.strokestyle']);
                this.original_colors['chart.highlight.fill']   = RG.array_clone(prop['chart.highlight.fill']);
                this.original_colors['chart.highlight.stroke'] = RG.array_clone(prop['chart.highlight.stroke']);
                this.original_colors['chart.text.color']       = RG.array_clone(prop['chart.text.color']);
            }




            /**
            * Parse various properties for colors
            */
            prop['chart.fillstyle']        = this.parseSingleColorForGradient(prop['chart.fillstyle']);
            prop['chart.strokestyle']      = this.parseSingleColorForGradient(prop['chart.strokestyle']);
            prop['chart.highlight.stroke'] = this.parseSingleColorForGradient(prop['chart.highlight.stroke']);
            prop['chart.highlight.fill']   = this.parseSingleColorForGradient(prop['chart.highlight.fill']);
            prop['chart.text.color']       = this.parseSingleColorForGradient(prop['chart.text.color']);
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
        this.parseSingleColorForGradient = function (color)
        {
            var canvas  = this.canvas;
            var context = this.context;
            
            if (!color) {
                return color;
            }
    
            if (typeof color === 'string' && color.match(/^gradient\((.*)\)$/i)) {
    
                var parts = RegExp.$1.split(':');
    
                // Create the gradient
                var grad = co.createLinearGradient(this.x, this.y, this.x + this.metrics[0], this.y);
    
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
        * Objects are now always registered so that the chart is redrawn if need be.
        */
        RG.Register(this);




        /**
        * the number of arguments is only one and it's an
        * object - parse it for configuration data and return.
        */
        if (parseConfObjectForOptions) {
            RG.parseObjectStyleConfig(this, conf.options);
        }
    };