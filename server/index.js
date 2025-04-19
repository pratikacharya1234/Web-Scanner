// ✅ Updated Backend: Scan and send vulnerabilities to frontend (no browser opening, no HTML saving)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import scanner from 'web-vuln-scanner';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/scan', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'Missing URL' });

  try {
    const results = await scanner.scan(url, {
      scanModules: ['xss', 'headers', 'ssl'],
      timeout: 30000,
      verbose: true,
      depth: 1,
      concurrency: 5,
      disableCrawler: false,
      userAgent: 'CustomScanner/1.0',
      headers: { 'X-Test-Header': 'demo' }
    });

    res.json({
      success: true,
      vulnerabilities: results.vulnerabilities.map(v => ({
        name: v.name,
        description: v.description,
        recommendation: v.recommendation || 'No recommendation'
      }))
    });
  } catch (error) {
    console.error('Scanner error:', error);
    res.status(500).json({ success: false, message: 'Scanner failed', error: error.message });
  }
});

app.listen(5000, () => console.log('✅ API server running at http://localhost:5000'));
