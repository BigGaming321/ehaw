/* js/config.js */
/* ==========================================================================
   E-HAW PROJECT — GLOBAL SUPABASE INITIALIZATION CONFIG
   ========================================================================== */

// 1. Replace these strings with your actual project API keys from your Supabase Dashboard
const SUPABASE_URL = "https://ykhwnaezxbfhpijmfvtn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraHduYWV6eGJmaHBpam1mdnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTMwMDUsImV4cCI6MjA5NDQ2OTAwNX0.6Azy-0Vi7eMfmzP1m6WxyFX74gLUsym2u8AvtSvNHxA";

// 2. Formally bind the client to the global window scope using the exact name your controllers use
if (typeof supabase !== 'undefined') {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase Client initialized successfully into window.supabaseClient!");
} else {
    console.error("Critical: The Supabase CDN SDK library failed to load before config.js executed.");
}

// Freeze the object so it cannot be modified accidentally by other scripts
Object.freeze(CONFIG);