// import { createClient } from '@supabase/supabase-js'
const createClient = require("@supabase/supabase-js").createClient

const supabaseUrl = "https://bcvhdafxyvvaupmnqukc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdmhkYWZ4eXZ2YXVwbW5xdWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjQyNzcxMDMsImV4cCI6MTk3OTg1MzEwM30.uvO4yx0pHlJb7Ez95-GMvUE2yWqcu13y2D2BiQU7eaM";


const supabase = createClient(supabaseUrl, supabaseAnonKey)
exports.supabase = supabase;