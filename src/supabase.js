import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://luspkkqwjpmzvfiqaglr.supabase.co'
const SUPABASE_KEY = 'sb_publishable_lb2nRo5ufy9egkkQmqrGOA_TDs_x4Bf'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
