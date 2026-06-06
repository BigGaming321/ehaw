/* js/config.js */

// Centralized configurations for your environments
const CONFIG = {
  // Local Development (Live Server) / GitHub Pages Production
    SUPABASE_URL: "https://ykhwnaezxbfhpijmfvtn.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlraHduYWV6eGJmaHBpam1mdnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4OTMwMDUsImV4cCI6MjA5NDQ2OTAwNX0.6Azy-0Vi7eMfmzP1m6WxyFX74gLUsym2u8AvtSvNHxA"

};

// Freeze the object so it cannot be modified accidentally by other scripts
Object.freeze(CONFIG);