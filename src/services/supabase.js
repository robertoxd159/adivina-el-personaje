import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wmhwdiribsxrtwnyzjyd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtaHdkaXJpYnN4cnR3bnl6anlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NDEyNDYsImV4cCI6MjA5MTMxNzI0Nn0.lNnMraujO2MYhPpcXL9RQYIBEftQE86LVHmZXYl2Imc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)