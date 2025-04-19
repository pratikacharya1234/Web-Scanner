import React, { useState, useEffect } from 'react';
import NavBar from './pages/NavBar';
import VulnerabilityModal from './pages/VulnerabilityModal';
import VulnerabilityCard from './pages/VulnerabilityCard';

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [history, setHistory] = useState([]);
  const [selectedVuln, setSelectedVuln] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('scanHistory')) || [];
    setHistory(stored);
  }, []);

  const addToHistory = (url, data) => {
    const timestamp = new Date().toISOString();
    const updated = [
      { url, data, timestamp },
      ...history.filter(entry => entry.url !== url)
    ].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
  };

  const getFixSuggestions = async (vulns) => {
    const prompt = `
You are a cybersecurity expert.

Below is a list of vulnerabilities detected in a website scan:

${vulns.map((v, i) => `${i + 1}. ${v.name}: ${v.description || 'No description'} — Recommendation: ${v.recommendation || 'None'}`).join("\n")}

For each:
- Explain what the vulnerability is
- Suggest how to fix it (step-by-step)
- Provide example code or headers if applicable

Respond in markdown format.
    `;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=YOUR_GEMINI_API_KEY", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await response.json();
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Non-JSON response: " + text);
      }

      if (data.success) {
        const suggestion = await getFixSuggestions(data.vulnerabilities);
        setVulnerabilities(data.vulnerabilities);
        setSuggestions(suggestion);
        addToHistory(targetUrl, {
          vulnerabilities: data.vulnerabilities,
          suggestions: suggestion
        });
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

  const handleViewHistory = (entry) => {
    if (!entry.data) return;
    setUrl(entry.url);
    setVulnerabilities(entry.data.vulnerabilities || []);
    setSuggestions(entry.data.suggestions || "");
    setActivePage("home");
  };

  const removeFromHistory = (urlToRemove) => {
    const updated = history.filter(entry => entry.url !== urlToRemove);
    setHistory(updated);
    localStorage.setItem('scanHistory', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('scanHistory');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <NavBar activePage={activePage} setActivePage={setActivePage} />

      {activePage === "about" ? (
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">About AI VulnScanner</h2>
          <p className="text-gray-700 leading-relaxed">
            AI VulnScanner is a real-time website vulnerability scanner that not only detects security issues on a website using a custom scanning engine,
            but also leverages Google's Gemini AI to explain and suggest practical remediations for each vulnerability.
            Built for students, developers, and ethical hackers, it's designed to help you secure your websites fast.
          </p>
        </div>
      ) : activePage === "history" ? (
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Scan History</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All
              </button>
            )}
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
                    title={entry.data ? 'Click to view report' : 'No scan data available'}
                  >
                    {entry.url}
                    <br />
                    <small className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</small>
                  </span>
                  <button
                    onClick={() => removeFromHistory(entry.url)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Remove from history"
                  >
                    ✕
                  </button>
                </li>
              ))
            )}
          </ul>
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

          {error && (
            <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vulnerabilities.length > 0 && (
              <VulnerabilityCard
                data={vulnerabilities}
                onClickVuln={(v) => {
                  setSelectedVuln(v);
                  setShowModal(true);
                }}
              />
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

      <VulnerabilityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        vulnerability={selectedVuln}
      />
    </div>
  );
}
