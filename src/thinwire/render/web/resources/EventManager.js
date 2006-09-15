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
//Manages the communication of both outbound and inbound events
var tw_EventManager = Class.extend({    
    _EVENT_WEB_COMPONENT: 0,
    _EVENT_GET_EVENTS: 1,
    _EVENT_LOG_MESSAGE: 2, 
    _EVENT_SYNC_CALL: 3,
    _EVENT_RUN_TIMER: 4,
    _autoSyncResponse: true,
    _outboundEvents: null,
    _postOutboundEvents: false,
    _vsEventOrder: null,
    _inboundEvents: null,
    _timerId: 0,
    _comm: null,
    
    construct: function() {
        this._eventLoop = this._eventLoop.bind(this);
        this._inboundEventListener = this._inboundEventListener.bind(this);        
    },
    
    _resetTimer: function(time) {        
        clearTimeout(this._timerId);
        this._timerId = setTimeout(this._eventLoop, time);                    
    },
    
    _inboundEventListener: function(calls) {
        if (calls.length > 0) {
            try {
                eval("calls = " + calls);                
                this._inboundEvents = this._inboundEvents.concat(calls);                
                this._resetTimer(0);
            } catch (e) {
                alert("SYNTAX ERROR WITH eval(calls): " + calls);
            }
        }
    },
        
    _eventLoop: function() {
        if (this._comm != null) {
            var timerTime = 100;
            
            if (this._postOutboundEvents && this._comm.isReady()) {
                this._postOutboundEvents = false;
                var msg = this._outboundEvents.join(":");                
                this._outboundEvents = [];
                this._vsEventOrder = {};
                msg = "data=" + encodeURIComponent(msg);
                this._inboundEventListener(this._comm.send("POST", tw_APP_URL, msg));
            }
            
            if (this._inboundEvents.length > 0) {
                var calls = this._inboundEvents;
                this._inboundEvents = [];
                
                for (var i = 0, cnt = calls.length; i < cnt; i++) {
                    var call = calls[i];            
                    var obj = call.i == undefined ? (call.n == undefined ? window : call.n) : tw_Component.instances[call.i];                    
                    
                    if (obj != null) {
                        if (call.s) this._autoSyncResponse = true; 
                        var ret = obj[call.m].apply(obj, call.a);            
                        
                        if (call.s && this._autoSyncResponse) {
                            this.sendSyncResponse(ret, true);
                            timerTime = 0;
                        }
                    }
                }            
            }
    
            this._resetTimer(timerTime);
        }        
    },
        
    _sendOutboundEvent: function(type, value) {
        this._queueOutboundEvent(type, value);
        this._postOutboundEvents = true;
        this._resetTimer(0);
    }, 
    
    _postOutboundEvent: function(type, value) {        
        this._queueOutboundEvent(type, value);
        this._postOutboundEvents = true;
    },
    
    _queueOutboundEvent: function(type, value) {
        this._outboundEvents.push(type);
        
        if (value == null) {
            this._outboundEvents.push(0);
            this._outboundEvents.push("");
        } else {
            this._outboundEvents.push(value.length);
            this._outboundEvents.push(value);
        }
    },
        
    manualSyncResponse: function() {
        this._autoSyncResponse = false;
    },
    
    sendViewStateChanged: function(id, name, value) {
        value = id + ":" + name + (value == null ? ":0:" : ":" + new String(value).length + ":" + value);
        this._sendOutboundEvent(this._EVENT_WEB_COMPONENT, value);
    },
        
    postViewStateChanged: function(id, name, value) {    
        value = id + ":" + name + (value == null ? ":0:" : ":" + new String(value).length + ":" + value);
        this._postOutboundEvent(this._EVENT_WEB_COMPONENT, value);
    },
    
    queueViewStateChanged: function(id, name, value) {
        value = id + ":" + name + (value == null ? ":0:" : ":" + new String(value).length + ":" + value);
        var key = id + ":" + name;
        var order = this._vsEventOrder[key];
                                        
        if (order == undefined) {            
            this._queueOutboundEvent(this._EVENT_WEB_COMPONENT, value);
            this._vsEventOrder[key] = this._outboundEvents.length - 2;            
        } else {
            this._outboundEvents[order] = value.length;
            this._outboundEvents[order + 1] = value;
        }                            
    },
        
    postLogMessage: function(levelName, msg) { this._postOutboundEvent(this._EVENT_LOG_MESSAGE, levelName + ":" + new String(msg).length + ":" + msg); },
    sendGetEvents: function() { this._sendOutboundEvent(this._EVENT_GET_EVENTS, ""); },    
    sendRunTimer: function(id) { this._sendOutboundEvent(this._EVENT_RUN_TIMER, id + ":"); },    
    
    sendSyncResponse: function(value, postOnly) {
        value = value == null ? "0:" : new String(value).length + ":" + value;
        
        if (postOnly) {
            this._postOutboundEvent(this._EVENT_SYNC_CALL, value);
        } else {
            this._sendOutboundEvent(this._EVENT_SYNC_CALL, value);
        }
    },
    
    start: function() {
        this._comm = new tw_HttpRequest(this._inboundEventListener);
        this._outboundEvents = [];
        this._inboundEvents = [];
        this._vsEventOrder = {};
        this._postOutboundEvents = false;
        this.sendGetEvents();
    },
    
    stop: function() {
        if (this._timerId != 0) clearTimeout(this._timerId);
        this._timerId = 0;
        if (this._comm != null) this._comm.abort();
        this._outboundEvents = null;
        this._inboundEvents = null;
        this._vsEventOrder = null;
        this._comm = null;
    }         
});

