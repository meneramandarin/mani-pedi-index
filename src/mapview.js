import React, { useEffect, useState } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const MapView = ({ data, filter }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [clusterer, setClusterer] = useState(null);

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
            featureType: "administrative.locality",
            elementType: "labels",
            stylers: [{ visibility: "simplified" }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#FFE5E5' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#FFF0F0' }]
          }
        ]
      });

      setMap(googleMap);
    });
  }, []);

  useEffect(() => {
    if (!map || !data.length) return;
  
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    // Group data by city
    const cityData = data.reduce((acc, item) => {
      if (!acc[item.city]) {
        acc[item.city] = {
          city: item.city,
          country: item.country,
          submissions: 0,
          totalPrice: 0,
          totalTime: 0,
          totalRating: 0
        };
      }
      acc[item.city].submissions++;
      acc[item.city].totalPrice += item.price;
      acc[item.city].totalTime += item.time;
      acc[item.city].totalRating += item.rating;
      return acc;
    }, {});
  
    const geocoder = new window.google.maps.Geocoder();
    const markerPromises = Object.values(cityData).map(city => 
      new Promise((resolve) => {
        geocoder.geocode({ address: `${city.city}, ${city.country}` }, (results, status) => {
          if (status === 'OK') {
            const position = results[0].geometry.location;
            const marker = new window.google.maps.Marker({
              position,
              map,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8 + (city.submissions * 2),
                fillColor: '#FF69B4',
                fillOpacity: 0.8,
                strokeWeight: 1,
                strokeColor: '#FFF'
              }
            });
  
            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-3">
                  <h3 class="font-bold">${city.city}</h3>
                  <p>Avg Price: $${(city.totalPrice / city.submissions).toFixed(2)}</p>
                  <p>Avg Time: ${(city.totalTime / city.submissions).toFixed(1)}hrs</p>
                  <p>Rating: ${(city.totalRating / city.submissions).toFixed(1)}★</p>
                  <p class="text-sm">${city.submissions} submissions</p>
                </div>
              `
            });
  
            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });
  
            resolve(marker);
          } else {
            resolve(null);
          }
        });
      })
    );
  
    Promise.all(markerPromises).then(newMarkers => {
      const validMarkers = newMarkers.filter(Boolean);
      setMarkers(validMarkers);
    });
  
  }, [map, data, filter]);

  return (
    <div id="map" className="w-full h-96 rounded-lg shadow-md" />
  );
};

export default MapView;