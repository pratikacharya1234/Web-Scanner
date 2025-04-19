import scanner from 'web-vuln-scanner';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Missing URL' });
  }

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

    return res.status(200).json({
      success: true,
      vulnerabilities: results.vulnerabilities.map(v => ({
        name: v.name,
        description: v.description,
        recommendation: v.recommendation || 'No recommendation'
      }))
    });
  } catch (error) {
    console.error('Scanner error:', error);
    return res.status(500).json({ success: false, message: 'Scanner failed', error: error.message });
  }
}
