// TODO: 
// mobile UI improvements
// combine mani and pedi data also in map view 
// extend price range to 100 (anything else is a rip off and won't show in accumulation anyways)
// zoom for neighborhood level in map view, e.g. Brooklyn, NY

import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import MapView from './mapview';  // Adjust path as needed

const ManiPediIndex = () => {
  const [formData, setFormData] = useState({
    price: '',
    time: '',
    is_mani: false,
    is_pedi: false,
    rating: 0
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [allData, setAllData] = useState([]);
  const [filter, setFilter] = useState('all'); // this is for the graph filter
  
  // This filters the data based on the selected service type
  const filteredData = allData.filter(data => {
    if (filter === 'mani') return data.is_mani;
    if (filter === 'pedi') return data.is_pedi;
    return true; // 'all'
});

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
  
      return data.results.map((result) => ({
        value: result.formatted_address,
        label: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        // Store the address components for later use
        address_components: result.address_components,
        // Optional: Parse components now
        parsedComponents: {
          neighborhood: result.address_components.find(c => 
            c.types.includes('sublocality_level_1') || 
            c.types.includes('neighborhood'))?.long_name,
          city: result.address_components.find(c => 
            c.types.includes('locality'))?.long_name,
          country: result.address_components.find(c => 
            c.types.includes('country'))?.long_name
        }
      }));
    } catch (error) {
      console.error('Error fetching geocoding data:', error);
      return [];
    }
  };

  // map view meowww
  const [showMap, setShowMap] = useState(false);

  const handleCityChange = (newValue) => {
    setSelectedCity(newValue);
  };

  const maxPrice = 100;
  const maxTime = 5;

  // Rating
  const StarRating = ({ rating, setRating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-2xl focus:outline-none ${
              star <= rating ? 'text-pink-800' : 'text-pink-300'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };
  
  // block users from submitting more than one data point per city every 3 weeks
  const checkLastSubmission = (city, isMani) => {
    const submissions = JSON.parse(localStorage.getItem('maniPediSubmissions') || '{}');
    const key = `${city}-${isMani ? 'mani' : 'pedi'}`;
    const lastSubmission = submissions[key];
    const threeWeeksAgo = Date.now() - (21 * 24 * 60 * 60 * 1000);
    
    return lastSubmission && lastSubmission > threeWeeksAgo;
  };
  
  // This function records a new submission
  const recordSubmission = (city, isMani) => {
    const submissions = JSON.parse(localStorage.getItem('maniPediSubmissions') || '{}');
    const key = `${city}-${isMani ? 'mani' : 'pedi'}`;
    submissions[key] = Date.now();
    localStorage.setItem('maniPediSubmissions', JSON.stringify(submissions));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Starting submission with data:', formData, selectedCity);
  
    // Debug log to see what we're getting from Google Maps
    console.log('Selected city data:', {
      fullValue: selectedCity.value,
      parsedCity: selectedCity.parsedComponents.city,
      neighborhood: selectedCity.parsedComponents.neighborhood,
      country: selectedCity.parsedComponents.country,
    });
  
// Check for recent submissions in local storage
if (formData.is_mani && checkLastSubmission(selectedCity.parsedComponents.city, true)) {
  const submissions = JSON.parse(localStorage.getItem('maniPediSubmissions') || '{}');
  const lastSubmission = submissions[`${selectedCity.parsedComponents.city}-mani`];
  const timeLeft = lastSubmission + (21 * 24 * 60 * 60 * 1000) - Date.now();
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

  let timeLeftMessage = '';
  if (daysLeft > 0) timeLeftMessage += `${daysLeft} days `;
  if (hoursLeft > 0) timeLeftMessage += `${hoursLeft} hours `;
  if (minutesLeft > 0) timeLeftMessage += `${minutesLeft} minutes`;

  alert(`You can only submit manicure data for this city once every 3 weeks. Time left until next submission: ${timeLeftMessage}`);
  return;
}

if (formData.is_pedi && checkLastSubmission(selectedCity.parsedComponents.city, false)) {
  const submissions = JSON.parse(localStorage.getItem('maniPediSubmissions') || '{}');
  const lastSubmission = submissions[`${selectedCity.parsedComponents.city}-pedi`];
  const timeLeft = lastSubmission + (21 * 24 * 60 * 60 * 1000) - Date.now();
  const daysLeft = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

  let timeLeftMessage = '';
  if (daysLeft > 0) timeLeftMessage += `${daysLeft} days `;
  if (hoursLeft > 0) timeLeftMessage += `${hoursLeft} hours `;
  if (minutesLeft > 0) timeLeftMessage += `${minutesLeft} minutes`;

  alert(`You can only submit pedicure data for this city once every 3 weeks. Time left until next submission: ${timeLeftMessage}`);
  return;
}
  
    // Mani or Pedi
    if (!formData.is_mani && !formData.is_pedi) {
      alert('Please select at least one service type');
      return;
    }
  
    // Rating validation
    if (formData.rating === 0) {
      alert('Please leave a rating');
      return;
    }
  
    // Create the submission data object
    const submitData = {
      city: selectedCity.parsedComponents.city || selectedCity.value,
      neighborhood: selectedCity.parsedComponents.neighborhood || null,
      country: selectedCity.parsedComponents.country,
      price: Number(formData.price),
      time: Number(formData.time),
      is_mani: formData.is_mani,
      is_pedi: formData.is_pedi,
      rating: formData.rating,
    };
  
    console.log('Submitting data:', submitData);
  
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
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
        // Record the submission timestamp in local storage
        if (formData.is_mani) {
          recordSubmission(selectedCity.parsedComponents.city, true);
        }
        if (formData.is_pedi) {
          recordSubmission(selectedCity.parsedComponents.city, false);
        }
  
        alert('Thank you for your submission!');
        setFormData({
          price: '',
          time: '',
          is_mani: false,
          is_pedi: false,
          rating: 0,
        });
  
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

     {/* Chart or MAP */}
<div className="bg-pink-50 rounded-lg p-4 mb-8">
  {showMap ? (
    <MapView data={allData} filter={filter} />
  ) : (
    <div className="overflow-x-auto no-scrollbar">
      <div className="relative h-[400px] min-w-[600px] border border-pink-200 bg-white rounded-lg p-16">

          {/* Y-axis values */}
          <div className="absolute left-4 top-16 bottom-16 flex flex-col justify-between text-sm text-pink-800">
            {[5, 4, 3, 2, 1, 0].map((num) => (
              <span key={num}>{num}</span>
            ))}
          </div>

          {/* X-axis values */}
          <div className="absolute bottom-4 left-16 right-16 flex justify-between text-sm text-pink-800">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((num) => (
              <span key={num}>${num}</span>
            ))}
          </div>

          {/* Plot points */}
          <div className="absolute inset-16 border-pink-200 border-l border-b">
            {filteredData.map((city, index) => {
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
      )}
      </div>

      {/* Toggle Buttons */}
<div className="relative w-full mb-8">
  {/* Scrollable container */}
  <div className="flex overflow-x-auto no-scrollbar px-4">
    {/* Inner container for buttons - adding md:justify-center and w-full */}
    <div className="flex space-x-4 min-w-max md:min-w-full md:justify-center">
      <button
        onClick={() => {
          setFilter('all');
          setShowMap(false);
        }}
        className={`shrink-0 px-4 py-2 rounded-md ${
          filter === 'all' && !showMap ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-800'
        }`}
      >
        Combined Data
      </button>
      <button
        onClick={() => {
          setFilter('mani');
          setShowMap(false);
        }}
        className={`shrink-0 px-4 py-2 rounded-md ${
          filter === 'mani' && !showMap ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-800'
        }`}
      >
        Manicure Data Only
      </button>
      <button
        onClick={() => {
          setFilter('pedi');
          setShowMap(false);
        }}
        className={`shrink-0 px-4 py-2 rounded-md ${
          filter === 'pedi' && !showMap ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-800'
        }`}
      >
        Pedicure Data Only
      </button>
      <button
        onClick={() => setShowMap(true)}
        className={`shrink-0 px-4 py-2 rounded-md ${
          showMap ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-800'
        }`}
      >
        Map View
      </button>
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
    <div className="space-y-2">
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.is_mani}
      onChange={e => setFormData({...formData, is_mani: e.target.checked})}
      className="rounded border-pink-300 text-pink-500 focus:ring-pink-500"
    />
    <span className="text-pink-800">Manicure 🫳</span>
  </label>
  <label className="flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.is_pedi}
      onChange={e => setFormData({...formData, is_pedi: e.target.checked})}
      className="rounded border-pink-300 text-pink-500 focus:ring-pink-500"
    />
    <span className="text-pink-800">Pedicure 🦶</span>
  </label>
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
          <div>
          <label className="block text-sm font-medium text-pink-800 mb-2">
           Rating
           </label>
          <StarRating 
           rating={formData.rating} 
            setRating={(value) => setFormData({...formData, rating: value})} 
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