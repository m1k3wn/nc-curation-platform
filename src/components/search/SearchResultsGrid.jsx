// src/components/search/SearchResultsGrid.jsx
import ItemCard from "./ItemCard";

export default function SearchResultsGrid({ results, loading }) {
  // If there are no results with images, show a message
  if (!loading && (!results || results.length === 0)) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No results with images found</p>
        <p className="text-gray-400">
          Try adjusting your search terms or browse another category
        </p>
      </div>
    );
  }

  // If loading, show a loading placeholder
  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Searching...</p>
      </div>
    );
  }

  // Render the grid of ItemCards
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
      {results.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
