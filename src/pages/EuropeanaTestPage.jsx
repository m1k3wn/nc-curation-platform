import { useState } from "react";
import { europeanaRepository } from "../api/repositories/europeanaRepository";
import { adaptEuropeanaSearchResults } from "../api/adapters/europeanaAdapter";
import ItemCard from "../components/search/ItemCard";

export default function EuropeanaTestPage() {
  const [query, setQuery] = useState("painting");
  const [searchResults, setSearchResults] = useState(null);
  const [adaptedResults, setAdaptedResults] = useState(null);
  const [recordResult, setRecordResult] = useState(null);
  const [healthResult, setHealthResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleHealthCheck = async () => {
    setLoading(true);
    setError(null);
    setHealthResult(null);

    try {
      const result = await europeanaRepository.healthCheck();
      setHealthResult(result);
    } catch (err) {
      setError(`Health check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    setAdaptedResults(null);

    try {
      const results = await europeanaRepository.search(query, {
        rows: 5,
      });
      setSearchResults(results);

      // Adapt the results to match our ItemCard format
      const adapted = adaptEuropeanaSearchResults(results);
      setAdaptedResults(adapted);
    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecord = async (recordId) => {
    setLoading(true);
    setError(null);
    setRecordResult(null);

    try {
      const result = await europeanaRepository.getRecord(recordId);
      setRecordResult(result);
    } catch (err) {
      setError(`Record fetch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Europeana API Test</h1>

      {/* Health Check Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Health Check</h2>

        <button
          onClick={handleHealthCheck}
          disabled={loading}
          className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 mb-4"
        >
          {loading ? "Checking..." : "Test API Connection"}
        </button>

        {healthResult && (
          <div className="bg-green-50 border border-green-200 p-4 rounded">
            <p className="text-green-800">✓ API connection successful!</p>
            <p className="text-sm text-green-600">
              Found {healthResult.totalResults} total records
            </p>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Search Test</h2>

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search term..."
            className="flex-1 px-3 py-2 border border-grey-300 rounded-md"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {adaptedResults &&
          adaptedResults.items &&
          adaptedResults.items.length > 0 && (
            <div className="space-y-4">
              <div className="text-sm text-grey-600">
                Found {adaptedResults.total} total results, showing{" "}
                {adaptedResults.items.length} with thumbnails
              </div>

              {/* ItemCard Grid */}
              <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-0">
                {adaptedResults.items.map((item) => (
                  <div key={item.id}>
                    <ItemCard item={item} />
                    {console.log("item id:", item.id)}
                  </div>
                ))}
              </div>
            </div>
          )}

        {searchResults && (
          <div className="space-y-4">
            <div className="text-sm text-grey-600">
              Raw API Results (showing {searchResults.itemsCount})
            </div>

            {searchResults.items?.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 bg-grey-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Thumbnail */}
                  <div>
                    {item.edmPreview ? (
                      <img
                        src={
                          Array.isArray(item.edmPreview)
                            ? item.edmPreview[0]
                            : item.edmPreview
                        }
                        alt={
                          Array.isArray(item.title)
                            ? item.title[0]
                            : item.title || "No title"
                        }
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-grey-200 rounded flex items-center justify-center text-grey-500">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="md:col-span-3 space-y-2">
                    <h3 className="font-medium">
                      {Array.isArray(item.title)
                        ? item.title[0]
                        : item.title || "No title"}
                    </h3>
                    <p className="text-sm text-grey-600">ID: {item.id}</p>
                    <p className="text-sm text-grey-600">Type: {item.type}</p>
                    <p className="text-sm text-grey-600">
                      Institution:{" "}
                      {Array.isArray(item.dataProvider)
                        ? item.dataProvider[0]
                        : item.dataProvider}
                    </p>
                    <button
                      onClick={() => handleGetRecord(item.id)}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Get Full Record →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Detail Section */}
      {recordResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Record Detail</h2>
          <div className="bg-grey-50 p-4 rounded-lg">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(recordResult, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Raw JSON Display */}
      {searchResults && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Raw Search Response</h2>
          <div className="bg-grey-50 p-4 rounded-lg">
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(searchResults, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
