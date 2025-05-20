// src/components/search/SearchBar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";

/**
 * Reusable search bar component that navigates to search results
 *
 * @param {string} initialValue - Initial search term (optional)
 */
export default function SearchBar({ initialValue = "" }) {
  const [inputValue, setInputValue] = useState(initialValue);
  const navigate = useNavigate();
  const { loading } = useSearch();

  // Update input value when initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = inputValue.trim();

    if (trimmedValue) {
      navigate(`/search?q=${encodeURIComponent(trimmedValue)}`);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative" role="search">
        <label htmlFor="search-input" className="sr-only">
          Search museum collections
        </label>
        <input
          id="search-input"
          type="text"
          placeholder="Search museum collections..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          disabled={loading}
          aria-label="Search term"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Search"
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
            loading
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          } text-white p-2 rounded-lg transition-colors`}
        >
          {loading ? (
            <div
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden="true"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
