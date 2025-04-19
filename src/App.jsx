import React, { useState, useEffect } from 'react';
import NavBar from './pages/NavBar';
import VulnerabilityCard from './pages/VulnerabilityCard';
import SuggestionBox from './pages/SuggestionBox';
import SkeletonBox from './pages/SkeletonBox';
import VulnerabilityModal from './pages/VulnerabilityModal';


export default function App() {
  const [url, setUrl] = useState("");
  const [scanMode, setScanMode] = useState("quick");
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
    const prompt = `You are a cybersecurity expert. Below is a list of vulnerabilities detected in a website scan:\n${vulns.map((v, i) => `${i + 1}. ${v.name}: ${v.description || 'No description'} — Recommendation: ${v.recommendation || 'None'}`).join("\n")}\nFor each: Explain what the vulnerability is, suggest how to fix it (step-by-step), and provide example code or headers if applicable.`;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDax07nxeU8DkzuZQON_xDBtFfwiQkM94U", {
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
        body: JSON.stringify({ url: targetUrl, scanMode })
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

  const calculateRiskLevel = () => {
    if (vulnerabilities.length === 0) return null;
    const high = vulnerabilities.filter(v => v.recommendation?.toLowerCase().includes("high")).length;
    const medium = vulnerabilities.filter(v => v.recommendation?.toLowerCase().includes("medium")).length;
    if (high >= 2) return "High";
    if (medium >= 2 || high === 1) return "Medium";
    return "Low";
  };

  const riskLevel = calculateRiskLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 text-gray-900">
      <NavBar activePage={activePage} setActivePage={setActivePage} />

      <VulnerabilityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        vulnerability={selectedVuln}
      />

      {activePage === "about" ? (
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">About AI VulnScanner</h2>
          <p className="text-gray-700 leading-relaxed">
            AI VulnScanner is a real-time vulnerability scanner that detects website issues using a scanning engine and suggests AI-powered remediations using Gemini.
          </p>
        </div>
      ) : activePage === "history" ? (
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Scan History</h2>
            {history.length > 0 && (
              <button onClick={clearHistory} className="text-sm text-red-600 hover:text-red-800">Clear All</button>
            )}
          </div>
          <ul className="list-disc list-inside space-y-2">
            {history.length === 0 ? (
              <li className="text-gray-500">No scans yet.</li>
            ) : (
              history.map((entry, index) => (
                <li key={index} className="flex items-start justify-between gap-4">
                  <span
                    onClick={() => entry.data && handleViewHistory(entry)}
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
      ) : (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter website URL (e.g., https://example.com)"
              className="w-full sm:flex-1 px-4 py-2 border border-blue-300 rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <select
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              className="px-4 py-2 border border-blue-300 rounded-xl bg-white shadow focus:outline-none focus:ring"
            >
              <option value="quick">Quick Scan</option>
              <option value="full">Full Scan</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition duration-200"
            >
              {loading ? "Scanning..." : "Scan"}
            </button>
          </form>

          {error && (
            <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>
          )}

          {riskLevel && (
            <div className={`text-sm font-semibold mb-4 px-4 py-2 rounded-xl inline-block ${riskLevel === 'High' ? 'bg-red-100 text-red-700' : riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
              🔥 Risk Level: {riskLevel}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <SkeletonBox />
            ) : (
              <>
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
                  <SuggestionBox content={suggestions} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
