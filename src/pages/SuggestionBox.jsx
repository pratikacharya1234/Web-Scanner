import React from 'react';

export default function SuggestionBox({ content }) {
  return (
    <div className="bg-white border border-green-300 p-5 rounded-xl shadow-sm overflow-auto">
      <h2 className="text-lg font-semibold text-green-800 mb-3">✅ Gemini Recommendations</h2>
      <div className="text-sm text-gray-800 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
    </div>
  );
}