import React, { useState } from 'react';

const ManiPediIndex = () => {
  const [formData, setFormData] = useState({
    city: '',
    price: '',
    time: '',
  });

  const data = [
    { city: 'San Francisco', price: 45, time: 1.5 },
    { city: 'Tokyo', price: 25, time: 1.0 },
    { city: 'Berlin', price: 36, time: 1.3 },
    { city: 'CDMX', price: 15, time: 1.1 },
    { city: 'Istanbul', price: 13, time: 3.0 },
    { city: 'Capetown', price: 20, time: 3.5 }
  ];

  const maxPrice = 50;
  const maxTime = 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitted:', formData);
    setFormData({ city: '', price: '', time: '' });
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
            {[5, 4, 3, 2, 1, 0].map(num => (
              <span key={num}>{num}</span>
            ))}
          </div>

          {/* X-axis values */}
          <div className="absolute bottom-4 left-16 right-16 flex justify-between text-sm text-pink-800">
            {[0, 10, 20, 30, 40, 50].map(num => (
              <span key={num}>${num}</span>
            ))}
          </div>

          {/* Plot points */}
          <div className="absolute inset-16 border-pink-200 border-l border-b">
            {data.map((city) => {
              const x = (city.price / maxPrice) * 100;
              const y = (city.time / maxTime) * 100;
              
              return (
                <div
                  key={city.city}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    bottom: `${y}%`,
                    transform: 'translate(-50%, 50%)'
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
            style={{ transform: 'rotate(-90deg) translate(-50%, -50%)' }}
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
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              className="w-full rounded-md border-pink-200 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              required
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
              onChange={e => setFormData({...formData, price: e.target.value})}
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
              onChange={e => setFormData({...formData, time: e.target.value})}
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