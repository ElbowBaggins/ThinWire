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
package thinwire.ui;

import java.lang.reflect.*;
import java.util.*;

/**
 * @author Joshua J. Gertzen
 */
class ClassReflector<T> {
    private static class Property {
        Class type;
        Method get;
        Method set;
    }
    
    private Map<String, Property> props = new HashMap<String, Property>();
    private Set<String> roPropNames;
    
    ClassReflector(Class<T> clazz, String fieldPrefix, String propPrefix) {
        try {
            if (fieldPrefix != null) {
                for (Field f : clazz.getFields()) {
                    if (f.getName().startsWith(fieldPrefix) && f.getType() == String.class) {
                        props.put((String)f.get(null), new Property()); 
                    }
                }
            }
            
            for (Method m : clazz.getMethods()) {
                String name = m.getName();
                int len = name.length();
                Class retType = m.getReturnType();
                Class[] argTypes = m.getParameterTypes();
                
                if (((name.startsWith("get") && len > 3) || (name.startsWith("is") && len > 2)) && retType != void.class && argTypes.length == 0) {
                    String propName = getPropertyName(propPrefix, name);
                    Property prop = props.get(propName);
                    if (fieldPrefix != null && prop == null) continue;
                    if (prop == null) props.put(propName, prop = new Property());
                    prop.get = m;
                    prop.type = retType;
                } else if (name.startsWith("set") && len > 3 && retType == void.class && argTypes.length == 1) {                
                    String propName = getPropertyName(propPrefix, name);
                    Property prop = props.get(propName);
                    if (fieldPrefix != null && prop == null) continue;
                    if (prop == null) props.put(propName, prop = new Property());
                    prop.set = m;
                    prop.type = argTypes[0];
                }
            }
            
            roPropNames = Collections.unmodifiableSet(props.keySet());
        } catch (Exception e) {
            if (e instanceof RuntimeException) throw (RuntimeException)e;
            throw new RuntimeException(e);
        }        
    }
            
    Object getProperty(T obj, String propertyName) {
        Property prop = props.get(propertyName);
        if (prop == null || prop.get == null || prop.set == null) throw new IllegalArgumentException("property '" + propertyName + "' is unknown");
        
        try {
            return prop.get.invoke(obj, (Object[])null);
        } catch (Exception e) {
            if (e instanceof RuntimeException) throw (RuntimeException)e;
            throw new RuntimeException(e);
        }
    }
    
    void setProperty(T obj, String propertyName, Object value) {
        Property prop = props.get(propertyName);
        if (prop == null) throw new IllegalArgumentException("property '" + propertyName + "' is unknown");
        Object convertValue = convertTo(prop.type, value);
        
        try {
            prop.set.invoke(obj, convertValue);
        } catch (Exception e) {
            if (e instanceof RuntimeException) throw (RuntimeException)e;
            throw new RuntimeException(e);
        }        
    }
    
    Set<String> getPropertyNames() {
        return roPropNames;
    }
    
    private static String getPropertyName(String propPrefix, String name) {
        String propName = name.substring(name.charAt(0) == 'i' ? 2 : 3);
        
        if (propPrefix == null) {
            propName = Character.toLowerCase(propName.charAt(0)) + (propName.length() > 1 ? propName.substring(1) : "");
        } else {
            propName = propPrefix + propName;
        }
        
        return propName;
    }
    
    private static Object convertTo(Class type, Object value) {
        if (value == null) return null;
        if (type.equals(value.getClass())) return value;        
        String str = value.toString();
        if (str.equals("null")) str = null;
        
        if (type == String.class) {
            value = str;
        } else if (type == boolean.class || type == Boolean.class) {
            value = Boolean.valueOf(str);
        } else if (type == int.class || type == Integer.class) {                            
            value = new Integer(Double.valueOf(str).intValue());
        } else if (type == long.class || type == Long.class) {                            
            value = new Long(Double.valueOf(str).longValue());
        } else if (type == short.class || type == Short.class) {
            value = new Short(Double.valueOf(str).shortValue());
        } else if (type == byte.class || type == Byte.class) {
            value = new Byte(Double.valueOf(str).byteValue());
        } else if (type == float.class || type == Float.class) {
            value = new Float(Double.valueOf(str).floatValue());
        } else if (type == double.class || type == Double.class) {
            value = Double.valueOf(str);                                
        } else if (type == char.class || type == Character.class) {                                
            value = new Character(str.charAt(0));
        } else {
            try {
                Field f = type.getField(str.toUpperCase().replace('-', '_'));                        
                value = f.get(null);
            } catch (NoSuchFieldException e2) {
                try {
                    Method m = type.getMethod("valueOf", String.class);
                    if (m.getReturnType() != type) throw new NoSuchMethodException("public static " + type + " valueOf(String value)");
                    value = m.invoke(null, value);
                } catch (NoSuchMethodException e) {
                    throw new RuntimeException(e);
                } catch (InvocationTargetException e) {
                    throw new RuntimeException(e);                
                } catch (IllegalAccessException e) {
                    throw new RuntimeException(e);
                }
            } catch (IllegalAccessException e2) {
                throw new RuntimeException(e2);
            }
        }
        
        return value;
    }    
}
