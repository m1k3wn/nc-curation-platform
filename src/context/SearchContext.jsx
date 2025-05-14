import { createContext, useContext, useState } from "react";

// Create the context
const SearchContext = createContext();

// Custom hook for using the search context
export function useSearch() {
  return useContext(SearchContext);
}

// Provider component
export function SearchProvider({ children }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sample museum collection data
  const mockMuseumData = [
    {
      id: "1",
      title: "Bronze Age Ceremonial Mask",
      description:
        "A rare ceremonial mask from the late Bronze Age, discovered in the ruins of an ancient temple complex. Shows remarkable craftsmanship and detail.",
      imageUrl: "https://via.placeholder.com/400x300/f0f0f0/303030?text=Mask",
      source: "British Museum",
      datePublished: "1200 BCE",
    },
    {
      id: "2",
      title: "Ming Dynasty Porcelain Vase",
      description:
        "Exquisite blue and white porcelain vase from the Ming Dynasty. Features intricate floral patterns and traditional Chinese motifs.",
      imageUrl: "https://via.placeholder.com/400x500/f0f0f0/303030?text=Vase",
      source: "National Museum of China",
      datePublished: "c. 1500 CE",
    },
  ];

  // Function to perform a search
  const performSearch = (searchQuery, reset = true) => {
    setLoading(true);

    // If resetting, clear previous results
    if (reset) {
      setResults([]);
      setPage(1);
      setHasMore(true);
      setQuery(searchQuery);
    }

    // Simulate API delay
    setTimeout(() => {
      // Filter mock data based on search query
      // In a real app, this would be an API call
      const filteredResults = mockMuseumData.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.source.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults((prev) =>
        reset ? filteredResults : [...prev, ...filteredResults]
      );
      setLoading(false);

      // For demo purposes, let's say there's no more after first page
      if (!reset) {
        setHasMore(false);
      }
    }, 500);
  };

  // Function to load more results (pagination)
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
      performSearch(query, false);
    }
  };

  // Clear search results
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setPage(1);
    setHasMore(true);
  };

  const searchValues = {
    query,
    results,
    loading,
    hasMore,
    performSearch,
    loadMore,
    clearSearch,
  };

  return (
    <SearchContext.Provider value={searchValues}>
      {children}
    </SearchContext.Provider>
  );
}
