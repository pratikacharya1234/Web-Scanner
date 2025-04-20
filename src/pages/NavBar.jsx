import React from 'react';

export default function NavBar({ activePage, setActivePage }) {
  return (
    <nav className="bg-white shadow sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={() => setActivePage("home")}>
          AI VulnScanner
        </h1>
        <div className="flex gap-6 text-sm sm:text-base">
          <button
            onClick={() => setActivePage("home")}
            className={`${activePage === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-500 transition`}
          >
            Home
          </button>
          <button
            onClick={() => setActivePage("about")}
            className={`${activePage === 'about' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-500 transition`}
          >
            About
          </button>
          <button
            onClick={() => setActivePage("history")}
            className={`${activePage === 'history' ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-500 transition`}
          >
            History
          </button>
        </div>
      </div>
    </nav>
  );
}
