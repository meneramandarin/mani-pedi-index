import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function aggregateData(rawData) {
  console.log('Raw data received:', rawData);
  
  const groupedData = rawData.reduce((acc, curr) => {
    // Unique key for mani and pedi
    const maniKey = `${curr.city}-mani`;
    const pediKey = `${curr.city}-pedi`;
    
    if (curr.is_mani && !acc[maniKey]) {
      acc[maniKey] = {
        city: curr.city,
        neighborhood: curr.neighborhood,
        country: curr.country,
        priceSum: 0,
        timeSum: 0,
        ratingSum: 0,
        count: 0,
        is_mani: true,
        is_pedi: false
      };
    }
    if (curr.is_pedi && !acc[pediKey]) {
      acc[pediKey] = {
        city: curr.city,
        neighborhood: curr.neighborhood,
        country: curr.country,
        priceSum: 0,
        timeSum: 0,
        ratingSum: 0,
        count: 0,
        is_mani: false,
        is_pedi: true
      };
    }
    
    // Add to appropriate totals
    if (curr.is_mani) {
      acc[maniKey].priceSum += Number(curr.price);
      acc[maniKey].timeSum += Number(curr.time);
      acc[maniKey].ratingSum += Number(curr.rating);
      acc[maniKey].count += 1;
    }
    if (curr.is_pedi) {
      acc[pediKey].priceSum += Number(curr.price);
      acc[pediKey].timeSum += Number(curr.time);
      acc[pediKey].ratingSum += Number(curr.rating);
      acc[pediKey].count += 1;
    }
    
    return acc;
  }, {});
  
  // Calculate averages
  return Object.values(groupedData).map(data => ({
    city: data.city,
    neighborhood: data.neighborhood,
    country: data.country,
    price: data.priceSum / data.count,
    time: data.timeSum / data.count,
    rating: data.ratingSum / data.count,
    is_mani: data.is_mani,
    is_pedi: data.is_pedi
  }));
}

async function aggregateLeaderboardData(rawData) {
  // Debug the incoming data
  console.log('Raw data entering aggregateLeaderboardData:', 
    rawData.map(d => ({
      city: d.city,
      is_mani: d.is_mani,
      is_pedi: d.is_pedi
    }))
  );
  
  const groupedData = rawData.reduce((acc, curr) => {
    const cityKey = curr.city;
    
    // Debug each iteration
    console.log('Processing entry:', {
      city: curr.city,
      is_mani: curr.is_mani,
      is_pedi: curr.is_pedi,
      currentTotal: acc[cityKey]?.count || 0
    });
    
    if (!acc[cityKey]) {
      acc[cityKey] = {
        city: curr.city,
        country: curr.country,
        priceSum: 0,
        timeSum: 0,
        ratingSum: 0,
        count: 0
      };
    }
    
    acc[cityKey].priceSum += Number(curr.price);
    acc[cityKey].timeSum += Number(curr.time);
    acc[cityKey].ratingSum += Number(curr.rating);
    acc[cityKey].count += 1;
    
    return acc;
  }, {});
  
  const result = Object.values(groupedData).map(data => {
    // Debug each final result
    console.log('Final data for', data.city, ':', {
      count: data.count,
      averages: {
        price: data.priceSum / data.count,
        time: data.timeSum / data.count,
        rating: data.ratingSum / data.count
      }
    });
    
    return {
      city: data.city,
      country: data.country,
      price: data.priceSum / data.count,
      time: data.timeSum / data.count,
      rating: data.ratingSum / data.count,
      totalServices: data.count
    };
  });
  
  return result;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Fetching data from Supabase...');
    const { data, error } = await supabase
      .from('mani_pedi_data')
      .select('*')

      console.log('Raw Supabase response in getAggregatedData:', {
        dataLength: data?.length,
        firstFewRecords: data?.slice(0, 3).map(d => ({
          city: d.city,
          is_mani: d.is_mani,
          is_pedi: d.is_pedi,
          price: d.price,
          time: d.time
        })),
        error
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Got raw data:', data);
    const aggregatedData = await aggregateData(data);
    console.log('Sending aggregated data:', aggregatedData);

    return res.status(200).json({ 
      success: true, 
      data: aggregatedData, 
      leaderboardData: await aggregateLeaderboardData(data)
    })
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    })
  }
}