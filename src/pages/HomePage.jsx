import { useNavigate } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";

export default function HomePage() {
  const navigate = useNavigate();

  const popularSearches = [
    "Yorkshire",
    "Occult",
    "Curious",
    "Amour",
    "Druids",
    "Ancient Temple",
  ];

  const categories = ["Natural History", "Ancient Civilizations", "Modern Art"];

  const handleSearch = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-4 mt-0">
          <h1 className="text-title text-5xl mb-2 ">Search the Archives</h1>
          <p className="text-body text-lg max-w-xl mx-auto">
            Explore millions of items from over 1000 collections
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Popular Searches */}
        <div className="mt-8 text-center">
          <h2 className="text-subtitle mb-4">Try searching for...</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="btn-action px-4 py-2"
                aria-label={`Search for ${term}`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
