import React, { useState, useEffect, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';

const generateMapHTML = (coordinates) => {
  const polylinePoints = coordinates.map(coord => `[${coord.lat}, ${coord.lng}]`).join(',');
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([22.5726, 88.3639], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        var polylinePoints = [${polylinePoints}];
        if (polylinePoints.length > 0) {
          var polyline = L.polyline(polylinePoints, { color: '#000', weight: 5, opacity: 0.8 }).addTo(map);
          map.fitBounds(polyline.getBounds());
        }
        
        // Add user location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(pos) {
              var lat = pos.coords.latitude;
              var lng = pos.coords.longitude;
              L.marker([lat, lng]).addTo(map).bindPopup('You are here').openPopup();
            },
            function(err) { console.warn('Location error:', err); }
          );
        }
      </script>
    </body>
    </html>
  `;
};

export default function OSMMap({ routeCoordinates = [] }) {
  const webviewRef = useRef(null);
  const [html, setHtml] = useState(generateMapHTML(routeCoordinates));

  useEffect(() => {
    setHtml(generateMapHTML(routeCoordinates));
  }, [routeCoordinates]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.map}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});