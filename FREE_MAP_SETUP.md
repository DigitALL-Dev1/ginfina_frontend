# Free GIS map setup

The GIS screen uses Leaflet with OpenStreetMap by default and an optional Esri satellite layer. No Google API key or Google billing setup is needed. Install frontend dependencies with `npm install` and start with `npm run dev`.

Satellite tiles are conservatively capped at native zoom 16. The map can zoom to 20 by enlarging those tiles instead of requesting higher-resolution tiles that may be unavailable. This does not create additional imagery detail. Coverage still varies by location; use OpenStreetMap if satellite coverage is missing. Tile network failures show a notice.

Site markers, GeoJSON feature popups/clicks, fitting feature bounds, reset, and fullscreen are supported. Provider attribution remains visible.

Zoom behavior: https://leafletjs.com/reference.html#gridlayer-maxnativezoom
