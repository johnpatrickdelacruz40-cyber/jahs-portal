import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cudvlpsjojvwwpwuchus.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZHZscHNqb2p2d3dwd3VjaHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTgxNDMsImV4cCI6MjA5NDE5NDE0M30.MziGl6V3I5JUw6SOaoGdSfjG6VEMNh3r2G9yU84KHLU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)