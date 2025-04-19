export default function Navbar({ activePage, setActivePage }) {
    return (
      <nav className="bg-white shadow sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">AI VulnScanner</h1>
          <div className="flex gap-4">
            <button
              className={`font-medium ${activePage === 'home' ? 'text-blue-600' : 'text-gray-700'}`}
              onClick={() => setActivePage("home")}
            >
              Home
            </button>
            <button
              className={`font-medium ${activePage === 'about' ? 'text-blue-600' : 'text-gray-700'}`}
              onClick={() => setActivePage("about")}
            >
              About
            </button>
          </div>
        </div>
      </nav>
    );
  }
  