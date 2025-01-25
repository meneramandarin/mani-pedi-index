import React, { useEffect, useState } from 'react';
import { Loader } from "@googlemaps/js-api-loader";

const MapView = ({ data, filter }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [countryMarkers, setCountryMarkers] = useState([]);
  const [currentZoom, setCurrentZoom] = useState(2);
  const ZOOM_THRESHOLD = 5;

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

      googleMap.addListener('zoom_changed', () => {
        setCurrentZoom(googleMap.getZoom());
      });

      setMap(googleMap);
    });
  }, []);

  useEffect(() => {
    if (!map || !data.length) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    countryMarkers.forEach(marker => marker.setMap(null));

    // Group data by country and city
    const groupedData = data.reduce((acc, item) => {
      if (!acc[item.country]) {
        acc[item.country] = {
          cities: {},
          totalPrice: 0,
          totalTime: 0,
          totalRating: 0,
          submissions: 0
        };
      }
      
      if (!acc[item.country].cities[item.city]) {
        acc[item.country].cities[item.city] = {
          totalPrice: 0,
          totalTime: 0,
          totalRating: 0,
          submissions: 0
        };
      }

      // Update city stats
      acc[item.country].cities[item.city].totalPrice += item.price;
      acc[item.country].cities[item.city].totalTime += item.time;
      acc[item.country].cities[item.city].totalRating += item.rating;
      acc[item.country].cities[item.city].submissions++;

      // Update country stats
      acc[item.country].totalPrice += item.price;
      acc[item.country].totalTime += item.time;
      acc[item.country].totalRating += item.rating;
      acc[item.country].submissions++;

      return acc;
    }, {});

    const geocoder = new window.google.maps.Geocoder();

    // Create country markers
    const countryPromises = Object.entries(groupedData).map(([country, data]) => 
      new Promise((resolve) => {
        geocoder.geocode({ address: country }, (results, status) => {
          if (status === 'OK') {
            const position = results[0].geometry.location;
            const marker = new window.google.maps.Marker({
              position,
              map: currentZoom < ZOOM_THRESHOLD ? map : null,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12 + (data.submissions),
                fillColor: '#FF1493',
                fillOpacity: 0.8,
                strokeWeight: 2,
                strokeColor: '#FFF'
              }
            });

            const avgPrice = (data.totalPrice / data.submissions).toFixed(2);
            const avgTime = (data.totalTime / data.submissions).toFixed(1);
            const avgRating = (data.totalRating / data.submissions).toFixed(1);

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-3">
                  <h3 class="font-bold">${country}</h3>
                  <p>Avg Price: $${avgPrice}</p>
                  <p>Avg Time: ${avgTime}hrs</p>
                  <p>Rating: ${avgRating}★</p>
                  <p class="text-sm">${data.submissions} submissions</p>
                  <p class="text-xs italic">Zoom in to see city details</p>
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

    // Create city markers
    const cityPromises = Object.entries(groupedData).flatMap(([country, countryData]) =>
      Object.entries(countryData.cities).map(([city, cityData]) =>
        new Promise((resolve) => {
          geocoder.geocode({ address: `${city}, ${country}` }, (results, status) => {
            if (status === 'OK') {
              const position = results[0].geometry.location;
              const marker = new window.google.maps.Marker({
                position,
                map: currentZoom >= ZOOM_THRESHOLD ? map : null,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8 + (cityData.submissions),
                  fillColor: '#FF69B4',
                  fillOpacity: 0.8,
                  strokeWeight: 1,
                  strokeColor: '#FFF'
                }
              });

              const avgPrice = (cityData.totalPrice / cityData.submissions).toFixed(2);
              const avgTime = (cityData.totalTime / cityData.submissions).toFixed(1);
              const avgRating = (cityData.totalRating / cityData.submissions).toFixed(1);

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div class="p-3">
                    <h3 class="font-bold">${city}</h3>
                    <p>Avg Price: $${avgPrice}</p>
                    <p>Avg Time: ${avgTime}hrs</p>
                    <p>Rating: ${avgRating}★</p>
                    <p class="text-sm">${cityData.submissions} submissions</p>
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
      )
    );

    Promise.all([...countryPromises, ...cityPromises]).then(allMarkers => {
      const validMarkers = allMarkers.filter(Boolean);
      const countryMarkersLength = countryPromises.length;
      
      setCountryMarkers(validMarkers.slice(0, countryMarkersLength));
      setMarkers(validMarkers.slice(countryMarkersLength));
    });

  }, [map, data, filter, currentZoom]);

  useEffect(() => {
    if (!map) return;

    countryMarkers.forEach(marker => {
      marker.setMap(currentZoom < ZOOM_THRESHOLD ? map : null);
    });

    markers.forEach(marker => {
      marker.setMap(currentZoom >= ZOOM_THRESHOLD ? map : null);
    });
  }, [currentZoom, map, markers, countryMarkers]);

  return (
    <div id="map" className="w-full h-96 rounded-lg shadow-md" />
  );
};

export default MapView;