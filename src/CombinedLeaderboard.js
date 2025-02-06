import React from 'react';
import _ from 'lodash';

const CombinedLeaderboard = ({ data }) => {
  // First, get the total submissions count per city from raw data
  const submissionCounts = _.countBy(data, 'city');

  // Then group and calculate averages
  const combinedData = _.chain(data)
    .groupBy('city')
    .map((cityData, city) => {
      const totalCount = cityData.length;
      return {
        city,
        country: cityData[0].country,
        rating: _.sumBy(cityData, 'rating') / totalCount,
        price: _.sumBy(cityData, 'price') / totalCount,
        time: _.sumBy(cityData, 'time') / totalCount,
        // totalServices: submissionCounts[city] // Use the raw count instead
      };
    })
    .value();

  // Sort by rating (highest first)
  const sortedData = _.orderBy(combinedData, ['rating'], ['desc']);

  return (
    <div className="overflow-y-auto max-h-[500px]">
      <table className="w-full">
        <thead className="sticky top-0 bg-white">
          <tr>
            <th className="px-4 py-2 text-left text-pink-800">Rank</th>
            <th className="px-4 py-2 text-left text-pink-800">City</th>
            <th className="px-4 py-2 text-left text-pink-800">Rating</th>
            <th className="px-4 py-2 text-left text-pink-800">Price</th>
            <th className="px-4 py-2 text-left text-pink-800">Time</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((city, index) => (
            <tr key={city.city} className="border-t border-pink-100">
              <td className="px-4 py-2 text-pink-800">#{index + 1}</td>
              <td className="px-4 py-2 text-pink-800">{city.city}</td>
              <td className="px-4 py-2 text-pink-800">
                {city.rating.toFixed(1)} ★
              </td>
              <td className="px-4 py-2 text-pink-800">${city.price.toFixed(2)}</td>
              <td className="px-4 py-2 text-pink-800">{city.time.toFixed(1)}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CombinedLeaderboard;