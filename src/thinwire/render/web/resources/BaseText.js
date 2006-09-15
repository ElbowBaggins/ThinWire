/*
 *                      ThinWire(TM) RIA Ajax Framework
 *              Copyright (C) 2003-2006 Custom Credit Systems
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 * Place, Suite 330, Boston, MA 02111-1307 USA
 *
 * Users wishing to use this library in proprietary products which are not 
 * themselves to be released under the GNU Public License should contact Custom
 * Credit Systems for a license to do so.
 * 
 *               Custom Credit Systems, Richardson, TX 75081, USA.
 *                          http://www.thinwire.com
 */
var tw_BaseText = tw_Component.extend({
    _supportEditMask: false,
    _timerId: 0,
    _editor: null,
    _subtractEditorWidth: 0,
    _lastValue: "",
    _useToolTip: true,
    _editMask: "",
    _validatedValue: "",
    _escapeLastPressedAt: null,
    _valueOnFocus: null,
    _selectionOld: undefined,
    
    construct: function(tagNames, classNames, id, containerId, support) {
        this.$.construct.apply(this, [tagNames[0], classNames[0], id, containerId, support]);
        this._box.style.borderColor = tw_borderColor;        
        
        var editor = document.createElement(tagNames[1]);    
        editor.className = classNames[1];
        if (tagNames.length > 2) editor.type = tagNames[2];
        this._box.appendChild(editor);
        this._editor = this._focusBox = this._fontBox = editor;

        this._focusListener = this._focusListener.bind(this);
        this._blurListener = this._blurListener.bind(this);
        
        tw_addEventListener(editor, "keyup", this._keyUpListener.bind(this));
        tw_addEventListener(editor, "mouseup", this._mouseUpListener.bind(this));
        tw_addEventListener(editor, "focus", this._focusListener);
        tw_addEventListener(editor, "blur", this._blurListener);        
        
        support = support == null ? ",," : "," + support + ",";            
        if (support.indexOf(",editMask,") >= 0) this._supportEditMask = true;                    
    },
        
    _keyUpListener: function(event) {
        if (!this.isEnabled()) return;
        var keyCode = tw_getEventKeyCode(event);
        this._validateInput(keyCode);
        this._textStateChange(true);
    },
        
    _mouseUpListener: function(event) {
        if (!this.isEnabled()) return;
        this._textStateChange(true);
    },

    setWidth: function(width) {
        this._width = width;
                   
        if (tw_sizeIncludesBorders) {    
            this._box.style.width = width + "px";
            var sub = tw_CALC_BORDER_SUB + this._subtractEditorWidth;
        } else {
            this._box.style.width = width <= tw_CALC_BORDER_SUB ? "0px" : (width - tw_CALC_BORDER_SUB + "px");            
            var sub = tw_CALC_BORDER_PADDING_SUB + this._subtractEditorWidth;
        }    
                
        this._editor.style.width = width <= sub ? "0px" : (width - sub + "px");
    },
    
    setHeight: function(height) {
        this._height = height;
        
        if (tw_sizeIncludesBorders) {
            this._box.style.height = height + "px";
            height -= tw_CALC_BORDER_SUB;
            if (heigth < 0) height = 0;
            this._editor.style.height = height + "px";
        } else {
            height -= tw_CALC_BORDER_SUB;
            if (height < 0) height = 0;
            this._box.style.height = height + "px";
            height -= (tw_PADDING_WIDTH * 2);
            if (height < 0) height = 0;
            this._editor.style.height = height + "px";
        }
    },
        
    setText: function(text) {
        this._lastValue = this._editor.value = text;
        if (this._useToolTip) this._editor.title = text; 
        this._validateInput(0);            
        this._textStateChange(false, true);
    },

    setEnabled: function(enabled) {        
        this.$.setEnabled.apply(this, [enabled]);        
        this._editor.readOnly = !enabled;
    },

    setFocus: function(focus) {        
        if (focus) {
            var ret = this.$.setFocus.apply(this, [focus]);        
            this._valueOnFocus = this._editor.value;
            this._textStateChange();
            //this._editor.focus();
        } else {
            this._textStateChange(false, true);
            var ret = this.$.setFocus.apply(this, [focus]);            
        }
        
        tw_setSelectionEnabled(focus);                    
        return ret;
    },    
    
    /****
     * Don't call this until the textfield has been attached to a document.
     * Calling it first resulted in an "unspecified" HTML error.  
     * 2005-09-13 djv
     */
    setSelectionRange: function(beginIndex, endIndex) {
        this._selectionOld = beginIndex + "," + endIndex;        
        if (tw_Component.currentFocus === this) tw_setSelectionRange(this._editor, beginIndex, endIndex);
    },
    
    _textStateChange: function(useTimer, noSelectChange) {
        if (useTimer && noSelectChange) alert("textStateChange does not support 'useTimer == true && noSelectChange == true'");
        var te = this._editor;
        
        if (this._timerId != 0) {
            clearTimeout(this._timerId);
            this._timerId = 0;
        }
                            
        if (te.value != this._lastValue) {        
            if (useTimer) {
                //if this is the first character, notify immediately
                if (te.value.length == 0 || (te.value.length > 0 && this._lastValue.length == 0)) {
                    this._changeText(noSelectChange);
                } else {
                    this._timerId = setTimeout(this._changeText.bind(this), 400);
                }
            } else {
                this._changeText(noSelectChange);
            }
        } else {
            if (useTimer) {
                this._timerId = setTimeout(this._handleSelectionChange.bind(this), 400);
            } else {
                this._handleSelectionChange(noSelectChange);
            }
        }        
    },
    
    _handleSelectionChange: function(noSelectChange) {
        if (noSelectChange || !this.isVisible() || !this.isEnabled()) return;
        this._timerId = 0;
        if (this._selectionOld == undefined) this._selectionOld = this._editor.value.length + "," + this._editor.value.length;            
        var selectionNew = tw_getSelectionRange(this._editor).join();

        if (this._selectionOld != selectionNew && selectionNew.indexOf("-1") == -1) {
            this.firePropertyChange("selectionRange", selectionNew);
            this._selectionOld = selectionNew;
        }
    },    
    
    _changeText: function(noSelectChange) {        
        this._timerId = 0;
        this._lastValue = this._editor.value;
        this.firePropertyChange("text", this._lastValue);
        if (this._useToolTip) this._editor.title = this._lastValue;
        this._handleSelectionChange(noSelectChange); //call selection notify
        
        /*if (this._lastValue.length == this._editMask.length) {
            if (this._parent instanceof tw_BaseContainer) {
                var children = this._parent._children;
                for (
            }
        }*/
    },    

    setAlignX: function(alignX) {
        this._editor.style.textAlign = alignX;
    },
    
    setEditMask: function(editMask) {
        if (!this._supportEditMask) { alert("'editMask' property not supported by this component"); return; }
        this._lastValue = this._editor.value;
        if (this._useToolTip) this._editor.title = this._lastValue;
    
        //If the editMask is all numeric then it indicates the maximum length, not a true mask.
        if (editMask.indexOf("<=") == 0) {
            var ary = [];
            var maxLength = parseInt(editMask.substring(2));
            
            while (--maxLength >= 0) {
                ary.push("x");
            }
            
            editMask = ary.join("");        
        }
            
        this._editMask = editMask;
        this._validatedValue = "";
        this._validateInput(0);
        this._textStateChange(false, true);
    },
    
    _reFromMask: function(data, mask, start, end) {
        var chMask, chData, reCh, tmp, fmcntr;
        var reMask = "";
        
        if (start == null) {
            start = 0;
            end = data.length;
        } else if (end == null)
            end = start + 1;
    
        for (fmcntr = start; fmcntr < end; fmcntr++) {
            chMask = mask.charAt(fmcntr);
            chData = data.charAt(fmcntr);
    
            switch (chMask) {
                case 'M': case 'h':
                    reCh = "[0-1]";
    
                    if (fmcntr > 0) {
                        if ("Mh".indexOf(mask.charAt(fmcntr - 1)) >= 0) {
                            if (data.charAt(fmcntr - 1) == '0')
                                reCh = "[1-9]";
                            else
                                reCh = "[0-2]";
                        }
                    }
    
                    break;
    
                case 'd':
                    reCh = "[0-3]";
    
                    if (fmcntr > 0) {
                        tmp = new Number(data.substring(mask.indexOf("MM"), mask.indexOf("MM") + 2));
    
                        if (mask.charAt(fmcntr - 1) == 'd') {
                            if (data.charAt(fmcntr - 1) == '3') {
                                if (tmp == 4 || tmp == 6 || tmp == 9 || tmp == 11)
                                    reCh = "[0]";
                                else
                                    reCh = "[0-1]";
                            } else if (data.charAt(fmcntr - 1) == '0')
                                reCh = "[1-9]";
                            else
                                reCh = "[0-9]";
                        } else {
                            if (tmp == 2)
                                reCh = "[0-2]";
                        }
                    }
    
                    break;
    
                case 'm':
                    reCh = "[0-5]";
    
                    if (fmcntr > 0) {
                        if (mask.charAt(fmcntr - 1) == 'm')
                            reCh = "[0-9]";
                    }
    
                    break;
    
                case 'p':
                    reCh = "[A|P|a|p]";
    
                    if (fmcntr > 0) {
                        if (mask.charAt(fmcntr - 1) == 'p')
                            reCh = "[M|m]";
                    }
    
                    break;
    
                case 'a':
                    reCh = "[A-Za-z ]";
                    break;
    
                case 'A':
                    reCh = "[A-Z ]";
                    break;
                    
                case 'x':
                    reCh = "[ -~]";
                    break;
                    
                case 'X':
                    reCh = "[ -`]|[{-~]";
                    break;
                    
                case '9': case '#':
                    reCh = "\\d";
                    break;
    
                case 'y':
                    if ((tmp = mask.indexOf("yyyy")) >= 0) {
                        if (tmp == fmcntr)
                            reCh = "[1-2]";
                        else if (tmp == fmcntr - 1) {
                            if (data.charAt(fmcntr - 1) == '1')
                                reCh = "[9]";
                            else
                                reCh = "[0-1]";
                        } else
                            reCh = "[0-9]";
                    } else
                        reCh = "[0-9]";
    
                    break;
    
                case '(':
                    reCh = "\\(";
                    break;
    
                case ')':
                    reCh = "\\)";
                    break;
    
                case '.':
                    reCh = "\\.";
                    break;
    
                default:
                    reCh = chMask;
            }
    
            reMask += reCh;
        }
    
        return new RegExp(reMask);
    },
    
    _validateInput: function(keyCode) {            
        var newValue = this._editor.value;
        var editMask = this._editMask;
        var valid = true;
        var cntr;
        var maskChars = "9#MdyAaXxhmp";
    
        if (editMask.length > 0 && newValue.length > 0) {  
            //Reformat amount masks, otherwise Validate data
            if (editMask.indexOf('#') >= 0) {
                var maxLength = editMask.length;
        
                var reChar;
                var vChar;
                var mCntr;
                var value = newValue;                               
                var mask = new String(editMask);                                
                var isNegative = false;
                
                if (mask.charAt(0) == "-") {
                    mask = mask.substring(1);                    
                    
                    if (value.charAt(0) == "-") {
                        value = value.substring(1);
                        isNegative = true;
                    }                        
                }
    
                //if the first character is '.' then add a zero to the begining automatically
                if (value.charAt(0) == '.') value = "0" + value;
                var valueDot = value.indexOf(".");
                var maskDot = mask.indexOf(".");
    
                if (valueDot >= 0) {
                    var valueBefore = value.substring(0, valueDot);
                    var valueAfter = value.substring(valueDot);
                    var chop = valueAfter.length - mask.substring(maskDot).length;
                    if (chop > 0) value = valueBefore + valueAfter.substring(0, valueAfter.length - chop);
                }
                
                var chop = value.length - mask.length;
                if (chop > 0) value = value.substring(chop);
                valueDot = value.indexOf(".");
                
                if (maskDot >= 0) {
                    if (valueDot >= 0) {
                        mask = mask.substring(0, maskDot + (value.length - valueDot));
                    } else {
                        mask = mask.substring(0, maskDot);
                    }
                }
                
                if (value.length > mask.length) {
                    valid = false;
                } else {                    
                    for (cntr = value.length - 1; cntr >= 0; cntr--) {
                        mCntr = (mask.length - value.length) + cntr;
                        reChar = this._reFromMask(value, mask, mCntr);
                        vChar = value.charAt(cntr);
                        
                        //If this mask character does not match the value's character then either
                        //remove the character from the value if the mask character is a format character,
                        //or insert the mask charcter.                        
                        if (!reChar.test(vChar)) {
                            if (valueDot >= 0 && cntr >= valueDot) {
                                valid = false;
                                break;
                            }
    
                            if (maskChars.indexOf(mask.charAt(mCntr)) >= 0) {
                                value = value.substring(0, cntr) + value.substring(cntr + 1);
                            } else {
                                value = value.substring(0, cntr) + vChar + mask.charAt(mCntr) + value.substring(cntr + 1);
                            }
                        }
                    }
    
                    do { 
                        vChar = value.charAt(0);
                        reChar = this._reFromMask(vChar, "#");
                        
                        if (!reChar.test(vChar)) {
                            value = value.substring(1);
                        } else {
                            break;
                        }
                    } while (true);
                    
                    if (isNegative) value = "-" + value;
                    newValue = value;
                    if (newValue.length > maxLength) {
                        valid = false;
                    }
                }
            } else {                          
                var dateMask = false;
                
                for (var i = 0, size = newValue.length; i < size; i++) {
                    var mch = editMask.charAt(i);
                    
                    if (i >= editMask.length) { //Truncate the value if it exceeds the mask                    
                        newValue = newValue.substring(0, i);                    
                        break;
                    } else if (!dateMask && mch == "y" && /\d\d\d\d/.test(newValue.substring(i, i + 4)) && editMask.charAt(i + 1) == "y" && editMask.charAt(i + 2) != "y") { //special rule to refromat four digit year to two digit year
                        dateMask = true;
                        newValue = newValue.substring(0, i) + newValue.substring(i + 2);
                        i--;
                    } else if (!this._reFromMask(newValue, editMask, i, i + 1).test(newValue.charAt(i))) {
                        //if not a maskchar, then insert the format char from the mask into
                        //the value at this point.                    
                        if (maskChars.indexOf(mch) == -1) {
                            newValue = newValue.substring(0, i) + mch + newValue.substring(i);
                            size++;
                        } else {
                            if (mch == "A" || mch == "X") {                                                                        
                                var charCode = newValue.charCodeAt(i);
                                
                                if (charCode >= "a".charCodeAt(0) && charCode <= "z".charCodeAt(0)) {
                                    newValue = newValue.substring(0, i) + String.fromCharCode(charCode).toUpperCase() + newValue.substring(i + 1);
                                    i--;
                                } else {
                                    valid = false;
                                    break;
                                }
                            } else {
                                valid = false;
                                break;
                            }
                        }
                    }
                }
                
                //Append trailing format characters from the mask
                if (valid && keyCode != 8) {
                    for (var i = newValue.length, size = editMask.length; i < size; i++) {
                        var mch = editMask.charAt(i); 
                        
                        if (maskChars.indexOf(mch) == -1) {
                            newValue += mch;
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        
        if (valid) this._validatedValue = newValue;
        if (this._editor.value != this._validatedValue) this._editor.value = this._validatedValue;                     
        return valid;
    },
    
    keyPressNotify: function(keyPressCombo) {        
        if (keyPressCombo == "Esc") {
            var time = new Date().getTime();
            
            if (this._escapeLastPressedAt == null || time - this._escapeLastPressedAt > 400) {
                this._escapeLastPressedAt = time;
                this._editor.value = this._valueOnFocus.length > 0 ? this._valueOnFocus : this._lastValue;                
            } else {
                this._escapeLastPressedAt = null;
                this._editor.value = this._valueOnFocus = "";
            }
            
            return false;
        } else {
            return this.$.keyPressNotify.apply(this, [keyPressCombo]);
        }        
    },
        
    destroy: function() {
        this._editor = null;
        this.$.destroy.apply(this, []);
    }
});

