const express = require('express');
const cors = require('cors');
const multer = require('multer'); // Added for image handling
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const PORT = process.env.PORT || 3000;

// Initialize Multer (Memory Storage is best for small-to-medium images)
const upload = multer({ storage: multer.memoryStorage() });

// Supabase Connection
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);


/* ============================================================
    REPORTS API
   ============================================================ */

/**
 * GET ALL REPORTS
 * Modified: Removed the .eq('validity', 'Valid') filter so admins 
 * can see "Awaiting Review" reports too.
 */
app.get('/api/reports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      // Removed the filter here so you can see Awaiting, Valid, and Invalid
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE REPORT (PATCH)
 * This is what makes the "Accept", "Reject", and "Resolve" buttons work.
 */
app.patch('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // Expects { validity: 'Valid', status: 'Pending' } etc.

  try {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   STATISTICS API
   ============================================================ */

app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch ALL reports from Supabase
    const { data: allReports, error } = await supabase
      .from('reports')
      .select('status, created_at, validity');

    if (error) throw error;

    // 2. Separate Valid (Accepted) reports from the rest
    const validReports = allReports.filter(r => r.validity === 'Valid');

    const stats = {
      // Total Submissions: includes Valid, Invalid, and Awaiting
      total: allReports.filter(r => r.validity !== 'Invalid').length,
      
      // Awaiting Acceptance: specifically only those not yet reviewed
      awaiting: allReports.filter(r => r.validity === 'Awaiting Review').length,
      
      // Time-based stats: Now modified to ONLY count Accepted (Valid) reports
      day: validReports.filter(r => r.created_at >= startOfToday).length,
      week: validReports.filter(r => r.created_at >= sevenDaysAgo).length,
      month: validReports.filter(r => r.created_at >= thirtyDaysAgo).length,
      
      // Status stats: (Remains focused on Valid reports)
      pending: validReports.filter(r => r.status === 'Pending').length,
      resolved: validReports.filter(r => r.status === 'Resolved').length,
      unresolved: validReports.filter(r => r.status === 'Unresolved').length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', upload.single('reportPhoto'), async (req, res) => {
  try {
    const { name, email, category, subject } = req.body;
    let imageUrl = null;

    if (req.file) {
      const file = req.file;
      
      // 1. MUST end in .jpg for your policy
      // 2. MUST be in the 'public/' folder for your policy
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
      const filePath = `public/${fileName}`; 

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('report-evidence') // Must match bucket_id in policy
        .upload(filePath, file.buffer, {
          contentType: 'image/jpeg', // Standard for .jpg
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('report-evidence')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    // Insert into DB remains the same...
    // 1. Get the current year
    const currentYear = new Date().getFullYear();

    // 2. Count existing reports for this year to determine the next sequence number
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      // This ensures we only count IDs starting with the current year
      .like('custom_id', `${currentYear}_%`);

    if (countError) throw countError;

    // 3. Format the sequence (e.g., 1 becomes 00000001)
    const nextSequence = (count + 1).toString().padStart(8, '0');
    const customId = `${currentYear}_${nextSequence}`;
    const { error: dbError } = await supabase
      .from('reports')
      .insert([{
          custom_id: customId,
          name, 
          email, 
          category, 
          subject,
          validity: 'Awaiting Review',
          status: 'Pending',
          image_url: imageUrl
      }]);

    if (dbError) throw dbError;
    res.status(201).json({ success: true });

  } catch (err) {
    console.error('UPLOAD ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Connected to Supabase PostgreSQL engine with Storage support.');
});
