import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function aggregateData(rawData) {
  console.log('Raw data received:', rawData);
  
  const groupedData = rawData.reduce((acc, curr) => {
    // Unique key for each city + service type combination
    const key = `${curr.city}-${curr.is_mani ? 'mani' : 'pedi'}`;
    console.log('Processing city and service:', key);
    
    if (!acc[key]) {
      acc[key] = {
        city: curr.city,
        neighborhood: curr.neighborhood,
        country: curr.country,
        priceSum: 0,
        timeSum: 0,
        ratingSum: 0,
        count: 0,
        is_mani: curr.is_mani,
        is_pedi: curr.is_pedi
      };
    }
    
    // Accumulate data for the city + service type
    acc[key].priceSum += Number(curr.price);
    acc[key].timeSum += Number(curr.time);
    acc[key].ratingSum += Number(curr.rating);
    acc[key].count += 1;
    
    return acc;
  }, {});

  console.log('Grouped data:', groupedData);
  
  const result = Object.values(groupedData).map(data => ({
    city: data.city,
    neighborhood: data.neighborhood,
    country: data.country,
    price: data.priceSum / data.count, // Calculate average price
    time: data.timeSum / data.count, // Calculate average time
    rating: data.ratingSum / data.count, // Calculate average rating
    is_mani: data.is_mani,
    is_pedi: data.is_pedi
  }));

  console.log('Final aggregated result:', result);
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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Got raw data:', data);
    const aggregatedData = await aggregateData(data);
    console.log('Sending aggregated data:', aggregatedData);

    return res.status(200).json({ 
      success: true, 
      data: aggregatedData 
    })
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    })
  }
}