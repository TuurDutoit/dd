/*
The MIT License (MIT)

Copyright (c) 2014 Tuur Dutoit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/




(function (root, factory) {
    "use strict";
    
    if (typeof define === 'function' && define['amd']) {
        define(factory);
    }
    else {
        root['dd'] = factory();
    }

}(window, function factory() {
    "use strict";
    
    
/**
 * Utilities & Variables
 *
 * Some utilities and variables used by the drag and drop functions further down
 */
    
    var EFFECT_ALLOWED = /^(copy|move|link|copyMove|copyLink|linkMove|all)$/;
    var DROP_EFFECT = /^(copy|move|link|all)$/;
    
    var addEvents = function(obj) {
        obj.__events = {};
        obj.on = obj.addEventListener = function(event, listener) {
            if(!this.__events[event]) {this.__events[event] = [];}
            this.__events[event].push(listener);
            
            return this;
        }
        obj.once = function(event, listener) {
            var self = this;
            var cb = function() {
                listener.apply(this, arguments);
                var index = self.__events[event].indexOf(this);
                if(index > -1) {self.__events[event].splice(index, 1);}
            }
            this.on(event, cb);
            
            return this;
        }
        obj.off = obj.removeEventListener = function(event, listener) {
            if(event && !listener) {
                delete this.__events[event];
            }
            else if(event && listener) {
                for (var i = 0, len = this.__events[event].length; i < len; i++) {
                    if(this.__events[event][i] === listener) {
                        this.__events[event][i].splice(i, 1);
                    }
                }
            }
            else if(!event && listener) {
                for(event in this.__events) {
                    for (var i = 0, len = this.__events[event].length; i < len; i++) {
                        if(this.__events[event][i] === listener) {
                            this.__events[event][i].splice(i, 1);
                        }
                    }
                }
            }
            
            return this;
        }
        obj.removeAllListeners = function() {
            this.__events = {};
            
            return this;
        }
        obj.emit = function(event, args, self) {
            if(this.__events[event]) {
                for (var i = 0, len = this.__events[event].length; i < len; i++) {
                    this.__events[event][i].apply(self, args);
                }
            }
            
            return this;
        }
        
        return obj;
    }
    
    var isData = function(data) {
        return data.length === 2 && typeof data[0] === "string";
    }
    var isDataArray = function(arr) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if(!isData(arr[i])) {return false;}
        }
        
        return true;
    }
    
    var addClass = function(elem, name) {
        elem.className = (elem.className + " " + name).replace(/ +/g, " ");
    }
    var removeClass = function(elem, name) {
        elem.className = elem.className.replace(name, "").replace(/ +/g, " ");
    }
    
    

    
/**
 * Drop
 *
 * The function handling drop targets
 */
    
    var drop = function(elems, options) {
        var DD = addEvents({});
        
        
        
    /**
     * Initialization
     *
     * Normalize elems to an array of DOMElements
     * Normalize options
     */
        
        // Get an array of DOMElements from whatever elem is
        if(typeof elems === "string") {
            // CSS selector
            elems = document.querySelectorAll(elems);
        }
        else if(typeof elems === "object" && elems.nodeType) {
            // DOMElement; just make it an array
            elems = [elems]
        }
        
        // Set up options
        options = options || {};
        options.click = !!options.click;
        options.dropEffect = options.dropEffect.match(DROP_EFFECT) ? options.dropEffect : false;
        
        
        
        
        
    /**
     * Variables
     *
     * Some variables that will be used throughout dd
     */
        
        var files = [];
        
        if(options.click) {
            var filechooser = document.createElement("input");
            filechooser.setAttribute("type", "file");
            filechooser.onclick = function(e) {
                files = e.target.files;
                DD.emit("click", [e, files]);
            }
        }
        
        
        
        
    /**
     * Set up Elements
     *
     * Bind event listeners
     * Set initial classes
     */
        
        for (var i = 0, len = elems.length; i < len; i++) {
            var elem = elems[i];
            
            addClass(elem, "dd-drop");
            
            if(options.click) {
                elem.onclick = function(e) {
                    DD.emit("click", [e, elem]);
                    filechooser.click();
                }
                addClass(elem, "dd-click");
            }
            
            elem.ondragenter = function(e) {
                if(options.dropEffect) {e.dataTransfer.dropEffect = options.dropEffect;}
                DD.emit("dragenter", [e, elem]);
                addClass(elem, "dd-dragover");
            }
            
            elem.ondragover = function(e) {
                e.preventDefault();
                DD.emit("dragover", [e, elem]);
            }
            
            elem.ondragleave = function(e) {
                DD.emit("dragleave", [e, elem]);
                removeClass(elem, "dd-dragover");
            }
            
            elem.ondrop = function(e) {
                e.preventDefault();
                if(e.dataTransfer.files.length) {files = e.dataTransfer.files;}
                DD.emit("drop", [e, elem]);
            }
        }
        
        
        
    /**
     * Return
     *
     * Return the Drop object
     */
        
        DD.elems = elems;
        DD.options = options;
        DD.files = files;
        
        return DD;
    }
    
    
    
    
/**
 * Drag
 *
 * The function handling draggable elements
 */
    
    var drag = function(elems, options) {
        var DD = addEvents({});
        
        
        
    /**
     * Initialization
     *
     * Normalize elems to an array of DOMElements
     * Normalize options
     */
        
        // Get an array of DOMElements from whatever elem is
        if(typeof elems === "string") {
            // CSS selector
            elems = document.querySelectorAll(elems);
        }
        else if(typeof elems === "object" && elems.nodeType) {
            // DOMElement; just make it an array
            elems = [elems]
        }
        
        // Set up options
        options = options || {};
        options.effectAllowed = options.effectAllowed.match(EFFECT_ALLOWED) ? options.effectAllowed : false;
        
        if(options.data instanceof Array) {
            if(isData(options.data)) {
                // data is one piece of data
                options.data = [options.data];
            }
            else if(!isDataArray(options.Data)) {
                // data is NOT an array of data, nor one piece of data.
                options.data = undefined;
            }
            // else: data is an array of data, just as we want it!
        }
        else if(options.data !== undefined && typeof options.data !== "function") {
            options.data = [["text/json", JSON.stringify(options.data)]];
        }
        else {
            options.data = undefined;
        }
        
        
        
        
        
        
    /**
     * Set up Elements
     *
     * Bind event listeners
     * Set initial classes
     */
        
        for (var i = 0, len = elems.length; i < len; i++) {
            var elem = elems[i];
            
            elem.setAttribute("draggable", "true");
            addClass(elem, "dd-drag");
            
            elem.ondragstart = function(e) {
                if(options.data) {
                    for (var i = 0, len = options.data.length; i < len; i++) {
                        e.dataTransfer.setData(options.data[i][0], options.data[i][1]);
                    }
                }
                DD.emit("dragstart", [e, elem]);
                addClass(elem, "dd-dragging");
            }
            
            elem.ondrag = function(e) {
                DD.emit("drag", [e, elem]);
            }
            
            elem.ondragend = function(e) {
                DD.emit("dragend", [e, elem]);
            }
        }
        
        
        
        
    /**
     * Return
     *
     * Return the Drag object
     */
        
        DD.elems = elems;
        DD.options = options;
        
        return DD;
    }
    
    
    
    
    
    
/**
 * Return
 *
 * Return an object exposing the drag and drop functions
 */
    return {drag: drag, drop: drop};
}));
