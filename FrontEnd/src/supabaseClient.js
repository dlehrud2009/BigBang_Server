import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ulrpfujsbktmjfnmhoyl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVscnBmdWpzYmt0bWpmbm1ob3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjQ3NTIsImV4cCI6MjA4MDgwMDc1Mn0.5OAaOraik_Sjub_VFD654cuN5QxwWzS2YF2tuecYptg' // 아래에서 가져올 것

export const supabase = createClient(supabaseUrl, supabaseAnonKey)