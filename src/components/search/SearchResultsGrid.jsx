// src/components/search/SearchResultsGrid.jsx
import SearchResultItem from "./SearchResultItem";

export default function SearchResultsGrid({ results }) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-0">
      {results.map((item) => (
        <SearchResultItem key={item.id} item={item} />
      ))}
    </div>
  );
}
