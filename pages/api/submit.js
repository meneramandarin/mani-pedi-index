import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { city, price, time } = req.body

  try {
    // Basic validation
    if (!city || !price || !time) {
      throw new Error('Missing required fields')
    }

    // Insert data
    const { data, error } = await supabase
      .from('mani_pedi_data')
      .insert([{ city, price, time }])

    if (error) throw error

    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(400).json({ success: false, error: error.message })
  }
}