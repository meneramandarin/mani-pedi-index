import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('mani_pedi_data')
      .select('count')
    
    res.status(200).json({ 
      working: !error,
      hasEnvVars: {
        url: !!process.env.SUPABASE_URL,
        key: !!process.env.SUPABASE_ANON_KEY
      },
      count: data?.[0]?.count,
      error
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}