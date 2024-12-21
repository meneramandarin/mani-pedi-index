import { createClient } from '@supabase/supabase-js'

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: [
    '/node_modules/@supabase/supabase-js/**',
  ],
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ message: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { city, price, time } = body

    const { data, error } = await supabase
      .from('mani_pedi_data')
      .insert([{ city, price, time }])

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}