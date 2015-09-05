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
    * first argument and the X coordinate of the axis as the second
    * 
    * @param string id The canvas tag ID
    * @param number x  The X coordinate of the Y axis
    */
    RGraph.Drawing.YAxis = function (conf)
    {

        /**
        * Allow for object config style
        */
        if (   typeof conf === 'object'
            && typeof conf.x === 'number'
            && typeof conf.id === 'string') {

            var id = conf.id
            var x  = conf.x;

            var parseConfObjectForOptions = true; // Set this so the config is parsed (at the end of the constructor)
        
        } else {

            var id = conf;
            var x  = arguments[1];
        }

        this.id                = id;
        this.canvas            = document.getElementById(this.id);
        this.context           = this.canvas.getContext("2d");
        this.canvas.__object__ = this;
        this.x                 = x;
        this.coords            = [];
        this.coordsText        = [];
        this.original_colors   = [];
        this.maxLabelLength    = 0;
        this.firstDraw         = true; // After the first draw this will be false


        /**
        * This defines the type of this shape
        */
        this.type = 'drawing.yaxis';


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
            'chart.gutter.top':       25,
            'chart.gutter.bottom':    25,
            'chart.min':              0,
            'chart.max':              null,
            'chart.colors':           ['black'],
            'chart.title':            '',
            'chart.title.color':      null,
            'chart.text.color':       null,
            'chart.numticks':         5,
            'chart.numlabels':        5,
            'chart.labels.specific':  null,
            'chart.text.font':        'Arial',
            'chart.text.size':        10,
            'chart.align':            'left',
            'hart.scale.formatter':   null,
            'chart.scale.point':      '.',
            'chart.scale.decimals':   0,
            'chart.scale.invert':     false,
            'chart.scale.zerostart':  true,
            'chart.scale.visible':    true,
            'chart.units.pre':        '',
            'chart.units.post':       '',
            'chart.linewidth':        1,
            'chart.noendtick.top':    false,
            'chart.noendtick.bottom': false,
            'chart.noyaxis':          false,
            'chart.tooltips':         null,
            'chart.tooltips.effect':   'fade',
            'chart.tooltips.css.class':'RGraph_tooltip',
            'chart.tooltips.event':    'onclick',
            'chart.xaxispos':         'bottom',
            'chart.events.click':     null,
            'chart.events.mousemove': null
        }


        /**
        * A simple check that the browser has canvas support
        */
        if (!this.canvas) {
            alert('[DRAWING.YAXIS] No canvas support');
            return;
        }
        
        /**
        * Create the dollar object so that functions can be added to them
        */
        this.$0 = {};


        /**
        * Translate half a pixel for antialiasing purposes - but only if it hasn't beeen
        * done already
        * 
        * ** Could use setTransform() here instead ?
        */
        if (!this.canvas.__rgraph_aa_translated__) {
            this.context.translate(0.5,0.5);
            
            this.canvas.__rgraph_aa_translated__ = true;
        }



        // Short variable names
        var RG    = RGraph;
        var ca    = this.canvas;
        var co    = this.context;
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
            * This should be done first - prepend the property name with "chart." if necessary
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
        * Draws the axes
        */
        this.draw =
        this.Draw = function ()
        {
            /**
            * Fire the onbeforedraw event
            */
            RG.FireCustomEvent(this, 'onbeforedraw');
    
            /**
            * Some defaults
            */
            this.gutterTop    = prop['chart.gutter.top'];
            this.gutterBottom = prop['chart.gutter.bottom'];
            
            
            /**
            * Stop this growing uncntrollably
            */
            this.coordsText = [];
            
            
    
            if (!prop['chart.text.color'])  prop['chart.text.color']  = prop['chart.colors'][0];
            if (!prop['chart.title.color']) prop['chart.title.color'] = prop['chart.colors'][0];
    
            /**
            * Parse the colors. This allows for simple gradient syntax
            */
            if (!this.colorsParsed) {
    
                this.parseColors();
    
                // Don't want to do this again
                this.colorsParsed = true;
            }
    
    
    
            // DRAW Y AXIS HERE
            this.DrawYAxis();
    
    
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
            if (this.getShape(e)) {
                return this;
            }
        };




        /**
        * Not used by the class during creating the axis, but is used by event handlers
        * to get the coordinates (if any) of the selected shape
        * 
        * @param object e The event object
        */
        this.getShape = function (e)
        {
            var mouseXY = RG.getMouseXY(e);
            var mouseX  = mouseXY[0];
            var mouseY  = mouseXY[1];
    
            if (   mouseX >= this.x - (prop['chart.align'] ==  'right' ? 0 : this.getWidth())
                && mouseX <= this.x + (prop['chart.align'] ==  'right' ? this.getWidth() : 0)
                && mouseY >= this.gutterTop
                && mouseY <= (ca.height - this.gutterBottom)
               ) {
                
                var x = this.x;
                var y = this.gutterTop;
                var w = 15;;
                var h = ca.height - this.gutterTop - this.gutterBottom;
    
                return {
                        0: this, 1: x, 2: y, 3: w, 4: h, 5: 0,
                        'object': this, 'x': x, 'y': y, 'width': w, 'height': h, 'index': 0, 'tooltip': prop['chart.tooltips'] ? prop['chart.tooltips'][0] : null
                       };
            }
    
            return null;
        };




        /**
        * This function positions a tooltip when it is displayed
        * 
        * @param obj object    The chart object
        * @param int x         The X coordinate specified for the tooltip
        * @param int y         The Y coordinate specified for the tooltip
        * @param objec tooltip The tooltips DIV element
        */
        this.positionTooltip = function (obj, x, y, tooltip, idx)
        {
            // If there's multiple charts on the canvas they leave unknown font settings
            co.font = prop['chart.text.size'] + ' ' + prop['chart.text.font'];

            var coordW     = co.measureText(prop['chart.max'].toFixed(prop['chart.scale.decimals'])).width;
            var coordX     = obj.x - coordW;
            var coordY     = obj.gutterTop;
            var coordH     = ca.height - obj.gutterTop - obj.gutterBottom;
            var canvasXY   = RG.getCanvasXY(ca);

            var width      = tooltip.offsetWidth;
            var height     = tooltip.offsetHeight;
    
            // Set the top position
            tooltip.style.left = 0;
            tooltip.style.top  = canvasXY[1] + ((ca.height - this.gutterTop - this.gutterBottom) / 2) + 'px';
    
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
            if ((canvasXY[0] + coordX + (coordW / 2) - (width / 2)) < 10) {
                tooltip.style.left = prop['chart.align'] == 'right' ? canvasXY[0] + obj.x - (width * 0.1) + (coordW / 2) + 'px'
                                                                    : (canvasXY[0] + coordX - (width * 0.1)) + (coordW / 2) + 'px';
                img.style.left = (width * 0.1) - 8.5 + 'px';
    
            // RIGHT edge
            } else if ((canvasXY[0] + coordX + (width / 2)) > document.body.offsetWidth) {
                tooltip.style.left = prop['chart.align'] == 'right' ? canvasXY[0] + obj.x  - (width * 0.9) + (coordW / 2) + 'px'
                                                                    : canvasXY[0] + coordX - (width * 0.9) + (coordW / 2) + 'px';
                img.style.left = ((width * 0.9) - 8.5) + 'px';
    
            // Default positioning - CENTERED
            } else {
                tooltip.style.left = prop['chart.align'] == 'right' ? canvasXY[0] + obj.x - (width / 2) + (coordW / 2) + 'px'
                                                                    : canvasXY[0] + obj.x - (width / 2) - (coordW / 2) + 'px';
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
            // When showing tooltips, this method can be used to highlight the X axis
        };




        /**
        * This allows for easy specification of gradients
        */
        this.parseColors = function ()
        {

            // Save the original colors so that they can be restored when the canvas is reset
            if (this.original_colors.length === 0) {
                this.original_colors['chart.colors'] = RG.array_clone(prop['chart.colors']);
            }




            /**
            * Parse various properties for colors
            */
            //prop['chart.title.color'] = this.parseSingleColorForGradient(prop['chart.title.color']);
            //prop['chart.text.color']  = this.parseSingleColorForGradient(prop['chart.text.color']);
            prop['chart.colors'][0] = this.parseSingleColorForGradient(prop['chart.colors'][0]);
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
            if (!color) {
                return color;
            }
    
            if (typeof color === 'string' && color.match(/^gradient\((.*)\)$/i)) {
    
                var parts = RegExp.$1.split(':');
    
                // Create the gradient
                var grad = co.createLinearGradient(0,prop['chart.gutter.top'],0,ca.height - this.gutterBottom);
    
                var diff = 1 / (parts.length - 1);
    
                grad.addColorStop(0, RG.trim(parts[0]));
    
                for (var j=1; j<parts.length; ++j) {
                    grad.addColorStop(j * diff, RG.trim(parts[j]));
                }
            }
    
            return grad ? grad : color;
        };




        /**
        * The function that draws the Y axis
        */
        this.drawYAxis =
        this.DrawYAxis = function ()
        {
            /**
            * Allow both axis.xxx and chart.xxx to prevent any confusion that may arise
            */
            for (i in prop) {
                if (typeof(i) == 'string') {
                    var key = i.replace(/^chart\./, 'axis.');
                    
                    prop[key] = prop[i];
                }
            }
    
            var x               = this.x;
            var y               = this.gutterTop;
            var height          = ca.height - this.gutterBottom - this.gutterTop;
            var min             = prop['chart.min'] ? prop['chart.min'] : 0;
            var max             = prop['chart.max'];
            var title           = prop['chart.title'] ? prop['chart.title'] : '';
            var color           = prop['chart.colors'] ? prop['chart.colors'][0] : 'black';
            var title_color     = prop['chart.title.color'] ? prop['chart.title.color'] : color;
            var label_color     = prop['chart.text.color'] ? prop['chart.text.color'] : color;
            var numticks        = typeof(prop['chart.numticks']) == 'number' ? prop['chart.numticks'] : 10;
            var labels_specific = prop['chart.labels.specific'];
            var numlabels       = prop['chart.numlabels'] ? prop['chart.numlabels'] : 5;
            var font            = prop['chart.text.font'] ? prop['chart.text.font'] : 'Arial';
            var size            = prop['chart.text.size'] ? prop['chart.text.size'] : 10;
            var align           = typeof(prop['chart.align']) == 'string'? prop['chart.align'] : 'left';
            var formatter       = prop['chart.scale.formatter'];
            var decimals        = prop['chart.scale.decimals'];
            var invert          = prop['chart.scale.invert'];
            var scale_visible   = prop['chart.scale.visible'];
            var units_pre       = prop['chart.units.pre'];
            var units_post      = prop['chart.units.post'];
            var linewidth       = prop['chart.linewidth'] ? prop['chart.linewidth'] : 1;
            var notopendtick    = prop['chart.noendtick.top'];
            var nobottomendtick = prop['chart.noendtick.bottom'];
            var noyaxis         = prop['chart.noyaxis'];
            var xaxispos        = prop['chart.xaxispos'];
    
    
            // This fixes missing corner pixels in Chrome
            co.lineWidth = linewidth + 0.001;
    
    
            /**
            * Set the color
            */
            co.strokeStyle = color;
    
            if (!noyaxis) {
                /**
                * Draw the main vertical line
                */
                pa(co,['b','m',Math.round(x), y,'l',Math.round(x), y + height,'s',color]);
    
                /**
                * Draw the axes tickmarks
                */
                if (numticks) {
                    
                    var gap = (xaxispos == 'center' ? height / 2 : height) / numticks;
                    var halfheight = height / 2;
        
                    co.beginPath();
                        for (var i=(notopendtick ? 1 : 0); i<=(numticks - (nobottomendtick || xaxispos == 'center'? 1 : 0)); ++i) {
                            pa(co, ['m',align == 'right' ? x + 3 : x - 3, Math.round(y + (gap *i)),'l',x, Math.round(y + (gap *i))]);
                        }
                        
                        // Draw the bottom halves ticks if the X axis is in the center
                       if (xaxispos == 'center') {
                            for (var i=1; i<=numticks; ++i) {
                                pa(co, ['m',align == 'right' ? x + 3 : x - 3, Math.round(y + halfheight + (gap *i)),'l',x, Math.round(y + halfheight + (gap *i))]);
                            }
                        }
                    co.stroke();
                }
            }
    
    
            /**
            * Draw the scale for the axes
            */
            co.fillStyle = label_color;
            //co.beginPath();
            var text_len = 0;
                if (scale_visible) {
                    if (labels_specific && labels_specific.length) {
                    
                        var text_len = 0;
    
                        // First - gp through the labels to find the longest
                        for (var i=0,len=labels_specific.length; i<len; i+=1) {
                            text_len = Math.max(text_len, co.measureText(labels_specific[i]).width);
                        }

                        for (var i=0,len=labels_specific.length; i<len; ++i) {
                        
                            var gap = (len-1) > 0 ? (height / (len-1)) : 0;
                            
                            if (xaxispos == 'center') {
                                gap /= 2;
                            }
    
                            RG.Text2(this, {'font':font,
                                                'size':size,
                                                'x':x - (align == 'right' ? -5 : 5),
                                                'y':(i * gap) + this.gutterTop,
                                                'text':labels_specific[i],
                                                'valign':'center',
                                                'halign':align == 'right' ? 'left' : 'right',
                                                'tag': 'scale'
                                               });
                            
                            /**
                            * Store the max length so that it can be used if necessary to determine
                            * whether the mouse is over the axis.
                            */
                            this.maxLabelLength = ma.max(this.maxLabelLength, co.measureText(labels_specific[i]).width);
                        }
                        
                        if (xaxispos == 'center') {
                            
                            // It's "-2" so that the center label isn't added twice
                            for (var i=(labels_specific.length-2); i>=0; --i) {
    
                                RG.Text2(this, {'font':font,
                                                    'size':size,
                                                    'x':x - (align == 'right' ? -5 : 5),
                                                    'y':ca.height - this.gutterBottom - (i * gap),
                                                    'text':labels_specific[i],
                                                    'valign':'center',
                                                    'halign':align == 'right' ? 'left' : 'right',
                                                    'tag': 'scale'
                                                   });
                            }
                        }

                    } else {
    
                        for (var i=0; i<=numlabels; ++i) {
            
                            var original = ((max - min) * ((numlabels-i) / numlabels)) + min;
                        
                            if (original == 0 && prop['chart.scale.zerostart'] == false) {
                                continue;
                            }
            
                            var text     = RG.number_format(this, original.toFixed(decimals), units_pre, units_post);
                            var text     = String(typeof(formatter) == 'function' ? formatter(this, original) : text);

                            // text_len is used below for positioning the title
                            var text_len = Math.max(text_len, co.measureText(text).width);
                            this.maxLabelLength = text_len;

                            if (invert) {
                                var y = height - ((height / numlabels)*i);
                            } else {
                                var y = (height / numlabels)*i;
                            }
                            
                            if (prop['chart.xaxispos'] == 'center') {
                                y = y / 2;
                            }
                            
                            // This fixes a bug, Replace this: -,400 with this: -400
                            text = text.replace(/^-,([0-9])/, '-$1');
            
            
                            /**
                            * Now - draw the labels
                            */
                            RG.Text2(this, {'font':font,
                                                'size':size,
                                                'x':x - (align == 'right' ? -5 : 5),
                                                'y':y + this.gutterTop,
                                                'text':text,
                                                'valign':'center',
                                                'halign':align == 'right' ? 'left' : 'right',
                                                'tag': 'scale'
                                               });
            
            
            
                            /**
                            * Draw the bottom half of the labels if the X axis is in the center
                            */
                            if (prop['chart.xaxispos'] == 'center' && i < numlabels) {
                                RG.Text2(this, {'font':font,
                                                    'size':size,
                                                    'x':x - (align == 'right' ? -5 : 5),
                                                    'y':ca.height - this.gutterBottom - y,
                                                    'text':'-' + text,
                                                    'valign':'center',
                                                    'halign':align == 'right' ? 'left' : 'right',
                                                    'tag': 'scale'
                                                   });
                            }
                        }
                    }
                }
            //co.stroke();

            /**
            * Draw the title for the axes
            */
            if (title) {
                co.beginPath();
    
                    co.fillStyle = title_color;
                    if (labels_specific) {
                        
                        var width = 0;
                        for (var i=0,len=labels_specific.length; i<len; i+=1) {
                            width = Math.max(width, co.measureText(labels_specific[i]).width);
                        }

                    } else {
                        var width = co.measureText(prop['chart.units.pre'] + prop['chart.max'].toFixed(prop['chart.scale.decimals']) + prop['chart.units.post']).width;
                    }
                    

                    RG.Text2(this, {'font':font,
                                    'size':size + 2,
                                    'x':align == 'right' ? x + width + 8 : x - width - 8,
                                    'y':height / 2 + this.gutterTop,
                                    'text':title,
                                    'valign':'bottom',
                                    'halign':'center',
                                    'angle':align == 'right' ? 90 : -90});
                co.stroke();
            }
        };




        /**
        * This detemines the maximum text width of either the scale or text
        * labels - whichever is given
        * 
        * @return number The maximum text width
        */
        this.getWidth = function ()
        {
            var width = this.maxLabelLength;
            
            // Add the title width if it's specified
            if (prop['chart.title'] && prop['chart.title'].length) {
                width += (prop['chart.text.size'] * 1.5);
            }

            this.width = width;
            
            return width;
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
        * This is the 'end' of the constructor so if the first argument
        * contains configuration data - handle that.
        */
        if (parseConfObjectForOptions) {
            RG.parseObjectStyleConfig(this, conf.options);
        }
    };