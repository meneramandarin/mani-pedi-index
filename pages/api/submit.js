import { createClient } from '@supabase/supabase-js'

export const config = {
  runtime: 'edge'
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req) {
  // Log the request method
  console.log('Request method:', req.method);

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: `Method ${req.method} not allowed` }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        } 
      }
    )
  }

  try {
    const body = await req.json()
    console.log('Received data:', body);

    const { data, error } = await supabase
      .from('mani_pedi_data')
      .insert([body])

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
}