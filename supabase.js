/* DJ Kena prod — Supabase connection */

const supabaseClient = window.supabase.createClient(
  "https://egznillzmyprbistirsz.supabase.co",
  "sb_publishable_6MFnS-gfA-0TLyynhiSY8g_4Zs_VDFJ"
);

export { supabaseClient as supabase };
