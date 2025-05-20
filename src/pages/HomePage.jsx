import { useNavigate } from "react-router-dom";
import SearchBar from "../components/search/SearchBar";

/**
 * Home page component with search functionality and quick access categories
 */
export default function HomePage() {
  const navigate = useNavigate();

  // Museum-related popular searches
  const popularSearches = [
    "Ancient Egypt",
    "Renaissance Art",
    "Dinosaur Fossils",
    "Medieval Armor",
    "Indigenous Artifacts",
    "Greek Pottery",
  ];

  // Museum categories
  const categories = ["Natural History", "Ancient Civilizations", "Modern Art"];

  /**
   * Navigate to search results for the selected term
   * @param {string} term - The search term to use
   */
  const handleSearch = (term) => {
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Discover Museum Collections
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Search across museums worldwide to discover artifacts, artworks, and
            historical treasures.
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Popular Searches */}
        <div className="mt-8 text-center">
          <h2 className="text-lg font-medium text-gray-600 mb-3">
            Popular Searches
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={`Search for ${term}`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Browse Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <button
                key={category}
                className="border border-gray-200 rounded-lg p-8 text-center hover:shadow-md transition-shadow"
                onClick={() => handleSearch(category)}
                aria-label={`Browse ${category} category`}
              >
                <h3 className="text-xl font-medium">{category}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
