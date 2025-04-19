import React, { useState } from 'react';
import NavBar from './pages/NavBar';

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [suggestions, setSuggestions] = useState("");
  const [error, setError] = useState(null);
  const [activePage, setActivePage] = useState("home");

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
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDax07nxeU8DkzuZQON_xDBtFfwiQkM94U", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      console.log("Gemini response:", data);
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ Gemini returned no suggestions.";
    } catch (err) {
      console.error("Gemini fetch error:", err);
      return "❌ Failed to fetch Gemini response.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestions("");
    setVulnerabilities([]);

    try {
      const res = await fetch("http://localhost:5000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      const data = await res.json();
      if (data.success) {
        setVulnerabilities(data.vulnerabilities);
        const suggestion = await getFixSuggestions(data.vulnerabilities);
        setSuggestions(suggestion);
      } else {
        setError(data.message || "Scan failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  const renderSeverityBadge = (text) => {
    if (text.toLowerCase().includes("high")) return <span className="text-red-600 font-bold text-xs ml-2">🔴 High</span>;
    if (text.toLowerCase().includes("medium")) return <span className="text-yellow-600 font-bold text-xs ml-2">🟡 Medium</span>;
    return <span className="text-green-600 font-bold text-xs ml-2">🟢 Info</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="bg-white border border-yellow-300 p-5 rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold text-yellow-800 mb-3">🛡️ Detected Vulnerabilities</h2>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                  {vulnerabilities.map((v, i) => (
                    <li key={i} className="flex flex-wrap">
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
