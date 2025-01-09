// aggregated data from vercel

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

async function aggregateData(rawData) {
    const groupedData = rawData.reduce((acc, curr) => {
      const key = curr.city;
      
      if (!acc[key]) {
        acc[key] = {
          city: curr.city,
          neighborhood: curr.neighborhood,
          country: curr.country,
          priceSum: 0,
          timeSum: 0,
          count: 0,
          is_mani: curr.is_mani,
          is_pedi: curr.is_pedi
        };
      }
      
      acc[key].priceSum += Number(curr.price);
      acc[key].timeSum += Number(curr.time);
      acc[key].count += 1;
      return acc;
    }, {});
  
    return Object.values(groupedData).map(data => ({
      city: data.city,
      neighborhood: data.neighborhood,
      country: data.country,
      price: data.priceSum / data.count,
      time: data.timeSum / data.count,
      is_mani: data.is_mani,
      is_pedi: data.is_pedi
    }));
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