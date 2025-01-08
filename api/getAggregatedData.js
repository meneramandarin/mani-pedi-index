// aggregated data from vercel

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function aggregateData(rawData) {
    console.log('Raw data received:', rawData);
    
    const groupedData = rawData.reduce((acc, curr) => {
      console.log('Processing city:', curr.city);
      if (!acc[curr.city]) {
        acc[curr.city] = {
          priceSum: 0,
          timeSum: 0,
          count: 0
        };
      }
      acc[curr.city].priceSum += curr.price;
      acc[curr.city].timeSum += curr.time;
      acc[curr.city].count += 1;
      return acc;
    }, {});
  
    console.log('Grouped data:', groupedData);
    
    const result = Object.entries(groupedData).map(([city, data]) => ({
      city,
      price: data.priceSum / data.count,
      time: data.timeSum / data.count
    }));
    
    console.log('Final aggregated data:', result);
    return result;
  }

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Get raw data
    const { data, error } = await supabase
      .from('mani_pedi_data')
      .select('*')

    if (error) throw error

    // Process data
    const aggregatedData = await aggregateData(data);

    return res.status(200).json({ 
      success: true, 
      data: aggregatedData 
    })
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    })
  }
}