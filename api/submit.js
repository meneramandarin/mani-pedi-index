import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Simplified CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { city, neighborhood, country, price, time } = req.body
      const { data, error } = await supabase
        .from('mani_pedi_data')
        .insert([{ 
          city, 
          neighborhood, 
          country, 
          price, 
          time 
        }])

      if (error) throw error

      return res.status(200).json({ success: true, data })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  }

  // Handle invalid methods
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}