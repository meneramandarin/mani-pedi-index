import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      const { city, price, time } = req.body
      const { data, error } = await supabase
        .from('mani_pedi_data')
        .insert([{ city, price, time }])

      if (error) throw error

      return res.status(200).json({ success: true, data })
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message })
    }
  }

  // Handle invalid methods
  return res.status(405).json({ success: false, message: 'Method not allowed' })
}