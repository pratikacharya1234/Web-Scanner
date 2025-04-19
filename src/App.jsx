// updated App.jsx with dark mode and pagination
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
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('scanHistory')) || [];
    setHistory(stored);
  }, []);

  const addToHistory = (url, data) => {
    const timestamp = new Date().toISOString();
    const updated = [{ url, data, timestamp }, ...history.filter(entry => entry.url !== url)].slice(0, 50);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
    setHistory(updated);
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(history.length / itemsPerPage);

  const exportCSV = () => {
    const headers = "URL,Timestamp,Vulnerability Name,Recommendation\n";
    const rows = history.flatMap(h => h.data?.vulnerabilities?.map(v => `${h.url},${h.timestamp},${v.name},${v.recommendation}`) || []);
    const blob = new Blob([headers + rows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'vulnscanner-history.csv');
  };

  const clearHistory = () => {
    localStorage.removeItem('scanHistory');
    setHistory([]);
    setCurrentPage(1);
  };

  const removeFromHistory = (urlToRemove) => {
    const updated = history.filter(entry => entry.url !== urlToRemove);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
  };

  const renderSeverityBadge = (text) => {
    const severity = text.toLowerCase();
    if (severity.includes("high")) return <span className="bg-red-100 text-red-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">High</span>;
    if (severity.includes("medium")) return <span className="bg-yellow-100 text-yellow-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">Medium</span>;
    return <span className="bg-green-100 text-green-700 font-bold text-xs ml-2 px-2 py-0.5 rounded">Low</span>;
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

  const getFixSuggestions = async (vulns) => {
    const prompt = `Explain and fix the following vulnerabilities:\n${vulns.map(v => `${v.name}: ${v.recommendation || 'None'}`).join("\n")}`;
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

  return (
    <div className={darkMode ? "min-h-screen bg-gray-900 text-white" : "min-h-screen bg-gray-50 text-gray-900"}>
      <NavBar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex justify-end p-4">
        <button
          onClick={toggleTheme}
          className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {activePage === "history" ? (
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Scan History</h2>
            <div className="flex gap-2">
              <button onClick={exportCSV} className="text-sm text-blue-600 hover:underline">Export CSV</button>
              <button onClick={clearHistory} className="text-sm text-red-600 hover:underline">Clear All</button>
            </div>
          </div>
          <ul className="list-disc list-inside space-y-2">
            {paginatedHistory.length === 0 ? (
              <li className="text-gray-500">No scans yet.</li>
            ) : (
              paginatedHistory.map((entry, index) => (
                <li key={index} className="flex items-start justify-between gap-4">
                  <span
                    onClick={() => entry.data && handleSubmit(null, entry.url)}
                    className={`flex-1 cursor-pointer ${entry.data ? 'text-blue-400 hover:underline' : 'text-gray-500'}`}
                  >
                    {entry.url}<br />
                    <small className="text-gray-400">{new Date(entry.timestamp).toLocaleString()}</small>
                  </span>
                  <button
                    onClick={() => removeFromHistory(entry.url)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >✕</button>
                </li>
              ))
            )}
          </ul>
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {[...Array(totalPages).keys()].map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num + 1)}
                  className={`px-3 py-1 rounded ${currentPage === num + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}
                >{num + 1}</button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full sm:flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700"
            >{loading ? "Scanning..." : "Scan"}</button>
          </form>

          {error && <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vulnerabilities.length > 0 && (
              <div className="border p-5 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold mb-3">🛡️ Detected Vulnerabilities</h2>
                <ul className="list-disc list-inside text-sm space-y-2">
                  {vulnerabilities.map((v, i) => (
                    <li key={i} className="flex flex-wrap items-center">
                      <span className="font-medium">{v.name}</span>: {v.recommendation || 'No recommendation'}
                      {renderSeverityBadge(v.recommendation || '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {suggestions && (
              <div className="border p-5 rounded-xl shadow-sm overflow-auto">
                <h2 className="text-lg font-semibold mb-3">✅ Gemini Recommendations</h2>
                <div className="text-sm whitespace-pre-line" dangerouslySetInnerHTML={{ __html: suggestions.replace(/\n/g, '<br/>') }} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
