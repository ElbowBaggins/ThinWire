/*
                         ThinWire(TM) RIA Ajax Framework
               Copyright (C) 2003-2006 Custom Credit Systems
  
  This program is free software; you can redistribute it and/or modify it under
  the terms of the GNU General Public License as published by the Free Software
  Foundation; either version 2 of the License, or (at your option) any later
  version.
  
  This program is distributed in the hope that it will be useful, but WITHOUT
  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
  FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License along with
  this program; if not, write to the Free Software Foundation, Inc., 59 Temple
  Place, Suite 330, Boston, MA 02111-1307 USA
 
  Users wishing to use this library in proprietary products which are not 
  themselves to be released under the GNU Public License should contact Custom
  Credit Systems for a license to do so.
  
                Custom Credit Systems, Richardson, TX 75081, USA.
                           http://www.thinwire.com
 #VERSION_HEADER#
 */
var tw_RadioButton = tw_BaseCheckRadio.extend({
    _groupId: 0,
    
    construct: function(id, containerId, props) {
        this.$.construct.apply(this, ["radioButton", id, containerId]);        
        this.init(-1, props);
    },
    
    setGroup: function(groupId) {
        if (this._groupId != 0) {
            var ary = tw_RadioButton.groups[this._groupId];
            
            for (var i = ary.length; --i >= 0;) {
                if (ary[i] === this) {
                    ary.splice(i, 1);
                    break;
                }
            }
            
            if (ary.length <= 0) delete tw_RadioButton.groups[this._groupId];
        }
        
        this._groupId = groupId;

        if (groupId != 0) {
            var ary = tw_RadioButton.groups[groupId];
            if (ary == undefined) tw_RadioButton.groups[groupId] = ary = [];
            ary.push(this);
        }
    },
    
    setChecked: function(checked) {
        if (checked && this._groupId != 0) {
            var ary = tw_RadioButton.groups[this._groupId];

            for (var i = ary.length; --i >= 0;) {
                if (ary[i].isChecked()) ary[i].setChecked(false, true);
            }
        }
        
        this.$.setChecked.apply(this, [checked, true]);
    },
    
    destroy: function() {
        this.setGroup(0);
        this.$.destroy.apply(this, []);
    }
});

tw_RadioButton.groups = {};

