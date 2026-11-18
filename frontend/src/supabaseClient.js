import { createClient } from "@supabase/supabase-js";
import { demoSupabase, demoAuth } from "./lib/demoSupabase";
import { isDemoMode } from "./lib/demo";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mode demo (tanpa env Supabase): pakai mock lokal supaya aplikasi tetap
// bisa dibuka dan dimainkan end-to-end di Cloudflare Pages. Saat env
// diset, client Supabase asli yang dipakai — perilaku tidak berubah.
export const supabase =
  isDemoMode || !supabaseUrl || !supabaseAnonKey
    ? demoSupabase
    : createClient(supabaseUrl, supabaseAnonKey);

export { isDemoMode, demoAuth };
