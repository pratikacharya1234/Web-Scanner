import scanner from 'web-vuln-scanner';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { url } = req.body;
  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ success: false, message: 'Invalid or missing URL' });
  }

  try {
    const results = await scanner.scan(url, {
      scanModules: ['headers', 'ssl'], //  faster than 'xss'
      timeout: 3000,                   //  below Vercel's 10s limit
      depth: 1,
      concurrency: 3,
      disableCrawler: true,           // no crawling = faster
      userAgent: 'CustomScanner/1.0',
      headers: { 'X-Test-Header': 'demo' }
    });

    res.status(200).json({
      success: true,
      vulnerabilities: results.vulnerabilities.map(v => ({
        name: v.name,
        description: v.description,
        recommendation: v.recommendation || 'No recommendation'
      }))
    });
  } catch (err) {
    console.error('❌ Scan error:', err);
    res.status(500).json({
      success: false,
      message: 'Scan failed due to timeout or error',
      error: err.message
    });
  }
}
