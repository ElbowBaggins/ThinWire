/*
 #LICENSE_HEADER#
 #VERSION_HEADER#
 */
//TODO: After removing a tab, if current index is no longer valid, then the server-model must be notified.
//TODO: Once the real estabe for tabs is exahasted, the tabs don't stack or scroll.
//TODO: What should the 'scroll' property do on a TabFolder?
//TODO: Enabled is not handled on a TabFolder currently.
//TODO: No real keyboard navigation for TabFolder or tabs.
var tw_TabFolder = tw_BaseContainer.extend({
    _currentIndex: -1,
    _tabs: null,
    
    construct: function(id, containerId, props) {
        this.$.construct.apply(this, ["tabFolder", id, containerId]);
        this._fontBox = null; 
        var s = this._box.style;
        s.backgroundColor = tw_COLOR_TRANSPARENT;
        s.overflow = "visible";
    
        this._tabs = document.createElement("div");
        var s = this._tabs.style;
        s.position = "absolute";
        s.zIndex = "1";
        this._box.appendChild(this._tabs);
        
        this._borderBox = this._backgroundBox = this._container = document.createElement("div");
        var s = this._container.style;
        s.position = "absolute";
        s.zIndex = "0";

        this._box.appendChild(this._container);    
        this.init(-1, props);
    },
    
    setStyle: function(name, value) {
        this.$.setStyle.apply(this, [name, value]);
        if (name == "borderSize") this._offsetX = this._offsetY = parseInt(value);
        
        if (name.indexOf("border") == 0) {
            for (var i in this._children) {
                this._children[i].setStyle(name, value);
            }
        }
    },    
    
    getOffsetY: function() {
        return this.$.getOffsetY.apply(this) + tw_TabFolder._tabsHeight;
    },
        
    setWidth: function(width) {
        this.$.setWidth.apply(this, [width]);
        this._tabs.style.width = width + "px";
        var cWidth = width - this._borderSizeSub;
        if (cWidth < 0) cWidth = 0;
        this._container.style.width = cWidth + "px";
        cWidth = width - this.getStyle("borderSize") * 2;
        if (cWidth < 0) cWidth = 0;

        for (var i = this._children.length; --i >= 0;) {
            this._children[i].setWidth(cWidth);
        }
    },
    
    setHeight: function(height) {
        this.$.setHeight.apply(this, [height]);
        this._container.style.top = this._tabs.style.height = tw_TabFolder._tabsHeight + "px";        
        var cHeight = height - this._borderSizeSub - tw_TabFolder._tabsHeight;
        if (cHeight < 0) cHeight = 0;
        this._container.style.height = cHeight + "px";
        cHeight = height - (this.getStyle("borderSize") * 2 + tw_TabFolder._tabsHeight);
        if (cHeight < 0) cHeight = 0;
        
        for (var i = this._children.length; --i >= 0;) {            
            this._children[i].setHeight(cHeight);
        }
    },
    
    addComponent: function(insertAtIndex, sheet) {
        var size = this.getWidth() - this.getStyle("borderSize") * 2;
        if (size < 0) size = 0;
        sheet.setWidth(size);
        var size = this.getHeight() - (this.getStyle("borderSize") * 2 + tw_TabFolder._tabsHeight);
        if (size < 0) size = 0;        
        sheet.setHeight(size);

        this._setTabActive(this._currentIndex, false);

        var tab = sheet._tab;
        sheet.setStyle("borderColor", this.getStyle("borderColor"));
        sheet.setStyle("borderType", this.getStyle("borderType"));
        sheet.setStyle("borderSize", this.getStyle("borderSize"));        
        
        if (insertAtIndex == -1 || insertAtIndex >= this._children.length) {
            this._tabs.appendChild(tab);
        } else {
            this._tabs.insertBefore(tab, this._tabs.childNodes.item(insertAtIndex));
        }
        
        this.$.addComponent.apply(this, [insertAtIndex, sheet]);
        
        if (this._currentIndex != insertAtIndex) this._setTabActive(insertAtIndex, false);
        this._setTabActive(this._currentIndex, true);
    },
    
    removeComponent: function(componentId) {
        this._setTabActive(this._currentIndex, false);
        var tab = tw_Component.instances[componentId]._tab;
        tab.parentNode.removeChild(tab);
        this.$.removeComponent.apply(this, [componentId]);
        var len = this._children.length;
        this._setTabActive(this._currentIndex < len ? this._currentIndex : len - 1, true);    
    },

    _setTabActive: function(index, active) {  
        var cl = this._children;
        if (index < 0 || index >= cl.length) return;
        var sheet = this._children[index];
        sheet.setActiveStyle(active);
        
        if (active) {
            this._focusBox = sheet._tab;
            this._currentIndex = index;
        }

        var commonSize = active ? "0px" : this.getStyle("borderSize") + "px";
        if (index == 0) this._tabs.style.paddingLeft = commonSize;        
        if (index > 0) cl[index - 1]._tab.style.borderRightWidth = commonSize;        
        if (index + 1 < cl.length) cl[index + 1]._tab.style.borderLeftWidth = commonSize;
    },
    
    keyPressNotify: function(keyPressCombo) {
        if (keyPressCombo == "Ctrl-Tab" || keyPressCombo == "Ctrl-Shift-Tab") {
            var cn = this._tabs.childNodes;

            if (keyPressCombo == "Ctrl-Tab") {
                var index = this._currentIndex + 1;
                if (index >= cn.length) index = 0;
            } else {
                var index = this._currentIndex - 1;
                if (index < 0) index = cn.length - 1;
            }

            this.setCurrentIndex(index, true);
            this.setFocus(true);
            return false;
        } else {
            return this.$.keyPressNotify.apply(this, [keyPressCombo]);            
        }
    },    

    setCurrentIndex: function(index, notify) {
        this._setTabActive(this._currentIndex, false);
        this._currentIndex = index;    
        this._setTabActive(this._currentIndex, true);
        if (notify) this.firePropertyChange("currentIndex", index);            
    },
    
    destroy: function() {
        this.$.destroy.apply(this, []);
        this._tabs = null;
    }
});

tw_TabFolder._tabsHeight = 20;


