// updated App.jsx
import React, { useState, useEffect } from 'react';
import NavBar from './pages/NavBar';
import { saveAs } from 'file-saver';

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('scanHistory')) || [];
    const sorted = stored.sort((a, b) => {
      const hasHighA = a.data?.vulnerabilities?.some(v => v.recommendation?.toLowerCase().includes('high'));
      const hasHighB = b.data?.vulnerabilities?.some(v => v.recommendation?.toLowerCase().includes('high'));
      return hasHighB - hasHighA;
    });
    setHistory(sorted);
  }, []);

  const addToHistory = (url, data) => {
    const timestamp = new Date().toISOString();
    const updated = [
      { url, data, timestamp },
      ...history.filter(entry => entry.url !== url)
    ].slice(0, 10);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    setHistory(updated);
  };

  const getFixSuggestions = async (vulns) => {
    const prompt = `
You are a cybersecurity expert.
Below is a list of vulnerabilities:
${vulns.map((v, i) => `${i + 1}. ${v.name}: ${v.description || 'No description'} — Recommendation: ${v.recommendation || 'None'}`).join("\n")}
Give detailed explanations, fixes, and code/config if applicable.
`;

    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDax07nxeU8DkzuZQON_xDBtFfwiQkM94U", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini returned no suggestions.";
    } catch (err) {
      console.error("Gemini fetch error:", err);
      return "❌ Failed to fetch Gemini response.";
    }
  };

  const handleSubmit = async (e, manualUrl = null) => {
    e?.preventDefault();
    const targetUrl = manualUrl || url;
    setLoading(true);
    setError(null);
    setSuggestions("");
    setVulnerabilities([]);

    try {
      const res = await fetch("/api/scan", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch {
        throw new Error("Non-JSON response: " + text);
      }

      if (data.success) {
        const suggestion = await getFixSuggestions(data.vulnerabilities);
        setVulnerabilities(data.vulnerabilities);
        setSuggestions(suggestion);
        addToHistory(targetUrl, { vulnerabilities: data.vulnerabilities, suggestions: suggestion });
      } else {
        setError(data.message || "Scan failed");
      }
    } catch (err) {
      console.error("Scan error:", err.message);
      setError(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = "URL,Timestamp,Vulnerability Name,Recommendation\n";
    const rows = history.flatMap(h => h.data?.vulnerabilities?.map(v => `${h.url},${h.timestamp},${v.name},${v.recommendation}`) || []);
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'vulnscanner-history.csv');
  };

  const handleViewHistory = (entry) => {
    if (!entry.data) return;
    handleSubmit(null, entry.url);
  };

  const removeFromHistory = (urlToRemove) => {
    const updated = history.filter(entry => entry.url !== urlToRemove);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    setHistory(updated);
  };

  const clearHistory = () => {
    localStorage.removeItem('scanHistory');
    setHistory([]);
  };

  const renderSeverityBadge = (text) => {
    const severity = text.toLowerCase();
    if (severity.includes("high")) return <span className="bg-red-100 text-red-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">High</span>;
    if (severity.includes("medium")) return <span className="bg-yellow-100 text-yellow-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">Medium</span>;
    return <span className="bg-green-100 text-green-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">Low</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar activePage={activePage} setActivePage={setActivePage} />

      {activePage === "history" ? (
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Scan History</h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="text-sm text-blue-600 hover:underline">Export CSV</button>
              <button onClick={clearHistory} className="text-sm text-red-600 hover:underline">Clear All</button>
            </div>
          </div>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            {history.length === 0 ? (
              <li className="text-gray-500">No scans yet.</li>
            ) : (
              history.map((entry, index) => (
                <li key={index} className="flex items-start justify-between gap-4">
                  <span
                    onClick={() => entry.data ? handleViewHistory(entry) : null}
                    className={`flex-1 cursor-pointer ${entry.data ? 'text-blue-600 hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                  >
                    {entry.url}<br />
                    <small className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</small>
                  </span>
                  <button
                    onClick={() => removeFromHistory(entry.url)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >✕</button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : activePage === "about" ? (
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">About AI VulnScanner</h2>
          <p className="text-gray-700 leading-relaxed">
            AI VulnScanner is a real-time website vulnerability scanner that detects issues and provides AI-powered suggestions for remediation.
            Built for developers, learners, and ethical hackers.
          </p>
        </div>
      ) : (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-blue-200"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition duration-200"
            >
              {loading ? "Scanning..." : "Scan"}
            </button>
          </form>

          {error && <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vulnerabilities.length > 0 && (
              <div className="bg-white border border-yellow-300 p-5 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-800 mb-3">🛡️ Detected Vulnerabilities</h2>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                  {vulnerabilities.map((v, i) => (
                    <li key={i} className="flex flex-wrap items-center">
                      <span className="font-medium text-gray-900">{v.name}</span>: {v.recommendation || 'No recommendation'}
                      {renderSeverityBadge(v.recommendation || '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suggestions && (
              <div className="bg-white border border-green-300 p-5 rounded-xl shadow-sm overflow-auto">
                <h2 className="text-lg font-semibold text-green-800 mb-3">✅ Gemini Recommendations</h2>
                <div className="text-sm text-gray-800 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
