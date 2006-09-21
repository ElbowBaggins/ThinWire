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
package thinwire.ui.style;

import java.util.HashMap;
import java.util.Map;

import thinwire.render.web.WebApplication;
import thinwire.ui.Application;

/**
 * @author Joshua J. Gertzen
 */
public class Font implements StyleGroup<Font> {
    public static final String PROPERTY_FONT_UNDERLINE = "fontUnderline";
    public static final String PROPERTY_FONT_ITALIC = "fontItalic";
    public static final String PROPERTY_FONT_BOLD = "fontBold";
    public static final String PROPERTY_FONT_SIZE = "fontSize";
    public static final String PROPERTY_FONT_COLOR = "fontColor";
    public static final String PROPERTY_FONT_FAMILY = "fontFamily";
    private static final ClassReflector<Font> reflect = new ClassReflector<Font>(Font.class, "PROPERTY_", "font");
    
    public static enum Family {
        SERIF, SANS_SERIF, CURSIVE, FANTASY, MONOSPACE;
        
        /*private static final Pattern FONT_NAME_PATTERN = Pattern.compile("[\\w|\\-| ]+");
        
        private ThreadLocal<String> optimalFontNames = new ThreadLocal<String>() {
            protected String initialValue() {
                return "";
            }
        };
                
        public void setOptimalFontNames(String optimialFontNames) {
            StringBuffer sb = new StringBuffer();            
            
            for (String s : optimialFontNames.split(",")) {
                s = s.trim();
                if (!FONT_NAME_PATTERN.matcher(s).matches()) throw new IllegalArgumentException("Font name '" + s + "' must match the regex pattern '" + FONT_NAME_PATTERN + "'");                
                sb.append(s).append(',');
            }
            
            sb.deleteCharAt(sb.length() - 1);
            optimalFontNames.set(sb.toString());
        }
        
        public String getOptimialFontNames() {
            return optimalFontNames.get();
        }*/
        
        public String toString() {
            return name().toLowerCase().replace('_', '-');
        }
    }

    private static Application.Local<Map<String, Metrics>> fontMetrics = new Application.Local<Map<String,Metrics>>() {
        protected Map<String, Metrics> initialValue() {
            return new HashMap<String, Metrics>();
        }
    };
    
    private static class Metrics {
        private int[] widths;
        private int height;
    }
    
    private Style parent;
    private Style defaultStyle;
    private Family family;
    private Color color;
    private int size;
    private int bold = -1;
    private int italic = -1;
    private int underline = -1;
    private String computedState;
    
    Font(Style parent, Style defaultStyle) {
        this.parent = parent;
        this.defaultStyle = defaultStyle;        
        if (defaultStyle != null) copy(defaultStyle.getFont());
    }
    
    private String getComputedState() {
        if (computedState == null) {
            StringBuilder sb = new StringBuilder();
            sb.append('"').append(getFamily()).append('"').append(';');
            sb.append(getSize()).append(';');
            sb.append(isBold()).append(';');
            sb.append(isItalic()).append(';');
            sb.append(isUnderline());
            computedState = sb.toString();
        }
        
        return computedState;
    }
    
    public int getStringWidth(String s) {
        String computedState = getComputedState();
        Map<String, Metrics> map = fontMetrics.get(); 
        Metrics fm = map.get(computedState);        
        
        if (fm == null) {
            fm = new Metrics();            
            String[] ary = ((WebApplication)WebApplication.current()).clientSideFunctionCallWaitForReturn("tw_getFontMetrics", getFamily(), getSize(), isBold(), isItalic(), isUnderline()).split(",");
            fm.widths = new int[ary.length - 1];
            fm.height = Integer.parseInt(ary[0]);
                            
            for (int i = 1, cnt = ary.length; i < cnt; i++) {
                fm.widths[i - 1] = Integer.parseInt(ary[i]);
            }
            
            map.put(computedState, fm);
        }
        
        int[] widths = fm.widths;        
        int width = 0;
        
        for (int i = 0, cnt = s.length(); i < cnt; i++) {
            char c = s.charAt(i);
            byte b = (byte)c;
            int w = widths[b - 32];
            width += w;
        }
        
        return width;
    }

    public Object getProperty(String propertyName) {
        return reflect.getProperty(this, propertyName);
    }
    
    public void setProperty(String propertyName, Object value) {
        reflect.setProperty(this, propertyName, value);
    }
    
    public Object getPropertyDefault(String propertyName) {
        if (defaultStyle == null) throw new IllegalStateException("defaultStyle == null");
        return reflect.getProperty(defaultStyle.getFont(), propertyName);
    }
        
    public void copy(Font font) {
        if (font == null) throw new IllegalArgumentException("font == null");
        
        for (String name : reflect.getPropertyNames()) {
            setProperty(name, font.getProperty(name));
        }
    }
    
    public Style getParent() {
        return parent;
    }
            
    public Family getFamily() {
        return family;
    }
    
    public void setFamily(Family family) {        
        if (family == null && defaultStyle != null) family = defaultStyle.getFont().getFamily();
        if (family == null) throw new IllegalArgumentException("family == null");
        Family oldFamily = this.family;
        this.computedState = null;
        this.family = family;
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_FAMILY, oldFamily, family);
    }
    
    public Color getColor() {
        if (color == null)  throw new IllegalStateException("color == null");
        return color;
    }
    
    public void setColor(Color color) {
        if (color == null && defaultStyle != null) color = defaultStyle.getFont().getColor();        
        if (color == null) throw new IllegalArgumentException("color == null");
        Color oldColor = this.color;
        this.color = color;        
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_COLOR, oldColor, this.color);
    }    
    
    public int getSize() {
        if (size <= 0) throw new IllegalStateException("size <= 0");
        return size;
    }
    
    public void setSize(int size) {
        if (size <= 0 && defaultStyle != null) size = defaultStyle.getFont().getSize();
        if (size <= 0 || size > 128) throw new IllegalArgumentException("size <= 0 || size > 128");
        int oldSize = this.size;
        this.computedState = null;        
        this.size = size;
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_SIZE, oldSize, size);
    }
    
    public boolean isBold() {
        if (bold == -1) throw new IllegalStateException("bold not initialized");
        return bold == 1 ? true : false;
    }
    
    public void setBold(boolean bold) {       
        boolean oldBold = this.bold == 1;
        this.computedState = null;        
        this.bold = bold == true ? 1 : 0;
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_BOLD, oldBold, bold);
    }

    public boolean isItalic() {
        if (italic == -1) throw new IllegalStateException("italic not initialized");
        return italic == 1 ? true : false;
    }
    
    public void setItalic(boolean italic) {
        boolean oldItalic = this.italic == 1;
        this.computedState = null;        
        this.italic = italic == true ? 1 : 0;
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_ITALIC, oldItalic, italic);
    }
    
    public boolean isUnderline() {
        if (underline == -1) throw new IllegalStateException("underline not initialized");
        return underline == 1 ? true : false;
    }
    
    public void setUnderline(boolean underline) {
        boolean oldUnderline = this.underline == 1;
        this.computedState = null;        
        this.underline = underline == true ? 1 : 0;
        if (parent != null) parent.firePropertyChange(this, PROPERTY_FONT_UNDERLINE, oldUnderline, underline);        
    }
}
