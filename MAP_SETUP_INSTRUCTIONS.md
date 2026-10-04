# Quick Setup: Leaflet + Esri Map

## Installation Steps

### 1. Install Dependencies
```bash
cd "d:\Ginfina updated 1\frontend"
npm install
```

This will install Leaflet 1.9.4 (already added to package.json).

### 2. Start Development Server
```bash
npm run dev
```

### 3. Test the Map
1. Open browser: http://localhost:5173 (or your dev server URL)
2. Navigate to: **SIA > GIS Mapping**
3. The **3D Map** tab should open automatically
4. You should see an interactive Esri Satellite map

---

## What You'll See

### Default View
- **Esri World Imagery** (satellite basemap)
- **Papua New Guinea** region (if no site selected)
- **Site marker** (if site has coordinates)
- **Map controls** in top corners
- **Status bar** at bottom right

### Map Controls
- **Top Left:** Basemap selector (6 options)
- **Top Right:** Zoom in/out, reset view, fullscreen
- **Bottom Left:** Scale bar
- **Bottom Right:** Layer/feature counts

---

## Testing Checklist

✅ **Map displays** - Should see Esri satellite imagery  
✅ **Basemap switcher works** - Try switching between Satellite, Streets, Topo, etc.  
✅ **Zoom controls work** - Click +/- buttons  
✅ **Site marker appears** - If site has lat/lon coordinates  
✅ **Features render** - If GIS features exist with geometry data  
✅ **Popups work** - Click markers/features to see info  

---

## Troubleshooting

### Problem: Map not showing
**Solution:** 
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problem: "Module not found: leaflet"
**Solution:**
```bash
# Install leaflet explicitly
npm install leaflet@1.9.4
```

### Problem: Markers not showing icons
**Solution:** Already fixed in code - icons load from CDN automatically

### Problem: Features not rendering
**Solution:** 
- Ensure features have `geometry_data` field with valid GeoJSON
- Check console for parsing errors
- Verify coordinates are [longitude, latitude] format

---

## Next Steps

Once the map is working:
1. **Add sites** with latitude/longitude coordinates
2. **Create GIS layers** 
3. **Add features** with GeoJSON geometry
4. **View features on map** - They'll render automatically!

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Leaflet is installed: `npm list leaflet`
3. Ensure dev server is running on correct port
4. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

---

**Status:** Ready to install and test! 🚀
