/*
ThinWire(R) Ajax RIA Framework
Copyright (C) 2003-2008 Custom Credit Systems

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*/
var tw_BaseRange = tw_Component.extend({
    _selection: null,
    _length: null,
    _multiplier: null,
    _vertical: false,
    _currentIndex: null,
        
    construct: function(tagName, className, id, containerId) {
        arguments.callee.$.call(this, tagName, className, id, containerId);
        this._fontBox = null;

        var selection = document.createElement("div");     
        var s = selection.style;
        var cssText = "position:absolute;line-height:0px;";
        tw_Component.setCSSText(cssText, selection);
        this._box.appendChild(selection);
        this._selection = this._backgroundBox = selection;
        tw_addEventListener(this._box, ["click", "dblclick"], this._clickListener.bind(this));
    },
    
    _recalc: function() {
        this._vertical = this._width <= this._height;
        this._updateMultiplier();
    },
    
    getMax: function() {
        return this._vertical ? this._height : this._width;
    },
    
    setLength: function(length) {
        if (length != null) this._length = length;
        this._updateMultiplier();
    },
    
    setCurrentIndex: function(currentIndex) {
        if (currentIndex != null) this._currentIndex = currentIndex;
        this._updateSelection();
    },
    
    getCurrentIndex: function() {
        return this._currentIndex;
    },
    
    setWidth: function(width) {
        arguments.callee.$.call(this, width);
        this._recalc();
    },
    
    setHeight: function(height) {
        arguments.callee.$.call(this, height);
        this._recalc();
    },
    
    _updateMultiplier: function() {
        this._multiplier = (this.getMax()) / (this._length - 1);
        this._updateSelection();
    },
    
    _updateSelection: function(hprop) {
        if (this.getCurrentIndex() == null || this._multiplier == null) return;
        var s = this._selection.style;
        if (this._vertical) {
            s.top = Math.floor(this.getMax() - (this.getCurrentIndex() * this._multiplier)) + "px";
        } else {
            s[hprop] = Math.floor(this.getCurrentIndex() * this._multiplier) + "px";
        }
    },
    
    _clickListener: tw_Component.clickListener
});
