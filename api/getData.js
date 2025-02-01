import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
    console.log('API Environment check:', {
      hasUrl: !!process.env.SUPABASE_URL,
      hasKey: !!process.env.SUPABASE_ANON_KEY
    });
  
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }
  
    try {
      const { data, error } = await supabase
        .from('mani_pedi_data')
        .select('*')
  
        console.log('Raw Supabase response in getData:', {
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
  
      if (error) throw error
  
      return res.status(200).json({ success: true, data })
    } catch (error) {
      console.log('Error details:', error);
      return res.status(400).json({ success: false, error: error.message })
    }
  }