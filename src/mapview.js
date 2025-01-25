import React, { useEffect, useState } from 'react';
import { Loader } from "@googlemaps/js-api-loader";

const MapView = ({ data, filter }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Filter data based on service type
  const filteredData = data.filter(item => {
    if (filter === 'mani') return item.is_mani;
    if (filter === 'pedi') return item.is_pedi;
    return true;
  });

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly"
    });

    loader.load().then(() => {
      const googleMap = new window.google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#FFE5E5' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#FFF0F0' }]
          },
          {
            featureType: 'road',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'administrative',
            elementType: 'geometry.stroke',
            stylers: [{ color: '#FF69B4', weight: 1 }]
          }
        ]
      });

      setMap(googleMap);
    });
  }, []);

  useEffect(() => {
    markers.forEach(marker => marker.setMap(null));
    
    if (!map) return;

    const newMarkers = filteredData.map(location => {
      const marker = new window.google.maps.Marker({
        position: { 
          lat: location.latitude, 
          lng: location.longitude 
        },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#FF69B4',
          fillOpacity: 0.8,
          strokeWeight: 1,
          strokeColor: '#FFF'
        },
        title: `${location.city}: $${location.price}`
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-bold">${location.city}</h3>
            <p>Price: $${location.price}</p>
            <p>Time: ${location.time}hrs</p>
            <p>Rating: ${'★'.repeat(location.rating)}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    setMarkers(newMarkers);
  }, [map, data, filter, markers]);

  return (
    <div id="map" className="w-full h-96 rounded-lg shadow-md" />
  );
};

export default MapView;