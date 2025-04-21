import React, { useState } from 'react';


export default function FixPlayground({ vulnerability }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testFix = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);

    const prompt = `You are a web security expert. A user provided the following fix for a vulnerability.\n\nVulnerability: ${vulnerability.name}\n\nDescription: ${vulnerability.description}\n\nFix Attempt:\n${code}\n\nIs this fix effective? Respond with:\n✅ Yes - if it works, or ❌ No - if it does not. Add one short reason.`;

    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=process.env.API_KEY", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });

      const data = await res.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No AI response.";
      setResult(answer);
    } catch (err) {
      setResult("❌ Error validating fix.");
    } finally {
      setLoading(false);
    }
  };

  if (!vulnerability) return null;

  return (
    <div className="mt-6 bg-white border border-indigo-200 rounded-xl p-4 shadow">
      <h3 className="text-md font-bold text-indigo-700 mb-2">🧪 Fix Playground</h3>
      <textarea
        className="w-full border border-gray-300 rounded p-2 text-sm font-mono focus:outline-none focus:ring focus:ring-indigo-200"
        rows="5"
        placeholder="Paste your HTTP header, config, or meta tag fix here..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        onClick={testFix}
        disabled={loading || !code.trim()}
        className="mt-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Validating..." : "🔍 Test Live Fix"}
      </button>

      {result && (
        <div className={`mt-3 text-sm font-medium px-4 py-2 rounded border ${result.includes('✅') ? 'bg-green-50 border-green-300 text-green-700' : 'bg-red-50 border-red-300 text-red-700'}`}>
          {result}
        </div>
      )}
    </div>
  );
}