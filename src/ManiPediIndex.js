// TODO:
// shorten cities, e.g. not London, UK, but just London 
// calculate avergaes for cities, combine cities 
// distinguish between mani and pedi
// combined data view
// mani only 
// pedi only 
// add saloons??? - not sure 

import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';

const ManiPediIndex = () => {
  const [formData, setFormData] = useState({
    price: '',
    time: '',
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [allData, setAllData] = useState([]);

  console.log('Environment variables:', {
    isDev: process.env.NODE_ENV === 'development',
    url: process.env.REACT_APP_SUPABASE_URL,
    hasKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
  });

  const isDev = process.env.NODE_ENV === 'development';
  const fetchUrl = isDev
    ? `${process.env.REACT_APP_SUPABASE_URL}/rest/v1/mani_pedi_data?select=*`
    : '/api/getAggregatedData';

  const fetchOptions = isDev
    ? {
        headers: {
          apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
      }
    : {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Attempting to fetch from:', fetchUrl);
        console.log('With options:', fetchOptions);

        const response = await fetch(fetchUrl, fetchOptions);
        const result = await response.json();
        console.log('Fetch result:', result);

        if (isDev) {
          setAllData(result);
        } else if (result.success) {
          setAllData(result.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [fetchUrl]);

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  // Google Maps API call
  const fetchCities = async (inputValue) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${inputValue}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      // Adapt the response to match the format expected by react-select:
      return data.results.map((result) => ({
        value: result.formatted_address,
        label: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      }));
    } catch (error) {
      console.error('Error fetching geocoding data:', error);
      return [];
    }
  };

  const handleCityChange = (newValue) => {
    setSelectedCity(newValue);
  };

  const maxPrice = 50;
  const maxTime = 5;

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Starting submission with data:', formData, selectedCity);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: selectedCity.value,
          price: Number(formData.price),
          time: Number(formData.time),
        }),
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      console.log('Raw response:', text);

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        alert('Thank you for your submission!');
        setFormData({ city: '', price: '', time: '' });
        // Fetch updated data after successful submission
        const updatedResponse = await fetch(fetchUrl, fetchOptions);
        const updatedResult = await updatedResponse.json();
        if (isDev) {
          setAllData(updatedResult);
        } else if (updatedResult.success) {
          setAllData(updatedResult.data);
        }
      } else {
        alert(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert('Error submitting data. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-pink-800 text-center mb-8">
        💅 Global Mani-Pedi Index 💅
      </h2>

      {/* Chart */}
      <div className="bg-pink-50 rounded-lg p-4 mb-8">
        <div className="relative h-[400px] w-full border border-pink-200 bg-white rounded-lg p-16">
          {/* Y-axis values */}
          <div className="absolute left-4 top-16 bottom-16 flex flex-col justify-between text-sm text-pink-800">
            {[5, 4, 3, 2, 1, 0].map((num) => (
              <span key={num}>{num}</span>
            ))}
          </div>

          {/* X-axis values */}
          <div className="absolute bottom-4 left-16 right-16 flex justify-between text-sm text-pink-800">
            {[0, 10, 20, 30, 40, 50].map((num) => (
              <span key={num}>${num}</span>
            ))}
          </div>

          {/* Plot points */}
          <div className="absolute inset-16 border-pink-200 border-l border-b">
            {allData.map((city, index) => {
              const x = (city.price / maxPrice) * 100;
              const y = (city.time / maxTime) * 100;

              return (
                <div
                  key={`${city.city}-${index}`}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    bottom: `${y}%`,
                    transform: 'translate(-50%, 50%)',
                  }}
                >
                  <div className="w-3 h-3 bg-pink-500 rounded-full" />
                  <div className="absolute left-4 -top-2 whitespace-nowrap text-xs text-pink-800">
                    {city.city}
                  </div>
                </div>
              );
            })}

            {/* Grid lines */}
            {[20, 40, 60, 80].map((percent) => (
              <div
                key={`h-${percent}`}
                className="absolute left-0 right-0 border-t border-pink-100"
                style={{ bottom: `${percent}%` }}
              />
            ))}
            {[20, 40, 60, 80].map((percent) => (
              <div
                key={`v-${percent}`}
                className="absolute top-0 bottom-0 border-l border-pink-100"
                style={{ left: `${percent}%` }}
              />
            ))}
          </div>

          {/* Axis labels */}
          <div className="absolute bottom-8 left-1/2 text-pink-800 font-medium">
            Price (USD)
          </div>
          <div
            className="absolute left-8 top-1/2 text-pink-800 font-medium"
            style={{
              transform: 'rotate(-90deg) translate(-50%, -50%)',
            }}
          >
            Time (hrs)
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-pink-50 rounded-lg p-6 max-w-xl mx-auto">
        <h3 className="text-xl font-medium text-pink-800 mb-6">
          Submit Your Local Mani-Pedi Data
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pink-800 mb-2">
              City
            </label>
            <AsyncSelect
              cacheOptions
              loadOptions={fetchCities}
              defaultOptions
              onInputChange={(newValue) => {
                // Optional: You can add logic here if needed
                return newValue;
              }}
              onChange={handleCityChange}
              placeholder="Type a city or location..."
              className="text-pink-800"
              value={selectedCity}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-800 mb-2">
              Price (USD)
            </label>
            <input
              type="number"
              name="price"
              min="0"
              max="100"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full rounded-md border-pink-200 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-pink-800 mb-2">
              Time (hours)
            </label>
            <input
              type="number"
              name="time"
              min="0.5"
              max="5"
              step="0.1"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="w-full rounded-md border-pink-200 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-2 px-4 rounded-md hover:bg-pink-600 transition-colors"
          >
            Submit Data
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManiPediIndex;