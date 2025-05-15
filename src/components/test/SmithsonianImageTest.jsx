import { useState, useEffect } from "react";
import { testSmithsonianAPI } from "../../api/smithsonianService";

function SmithsonianImageTest() {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("painting");
  const [imageResults, setImageResults] = useState({});

  // Function to test a single URL
  const testImageUrl = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Run the test
  const runTest = async () => {
    setLoading(true);
    try {
      const results = await testSmithsonianAPI(query);
      setTestResults(results);

      // Test each image URL
      const urlTests = {};

      for (const item of results.itemsWithMedia) {
        for (const media of item.media) {
          // Test original URL
          if (media.url) {
            urlTests[media.url] = await testImageUrl(media.url);
          }

          // Test thumbnail URL
          if (media.thumbnail) {
            urlTests[media.thumbnail] = await testImageUrl(media.thumbnail);
          }

          // Test deliveryService variant
          if (media.url) {
            const deliveryUrl = media.url.includes("deliveryService")
              ? media.url
              : media.url.replace(
                  /\/ids\/[^\/]+\//,
                  "/ids/deliveryService?id="
                );
            urlTests[deliveryUrl] = await testImageUrl(deliveryUrl);
          }

          // Test idsId-based URL
          if (media.idsId) {
            const idsIdUrl = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
            urlTests[idsIdUrl] = await testImageUrl(idsIdUrl);
          }
        }
      }

      setImageResults(urlTests);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically run once on mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Smithsonian Image Test (Diagnostic)
      </h1>

      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border p-2 mr-2 rounded"
          placeholder="Search query"
        />
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Testing..." : "Run Test"}
        </button>
      </div>

      {testResults && (
        <div>
          <h2 className="text-xl font-bold mb-2">API Response Summary</h2>
          <p className="mb-4">Total items found: {testResults.totalResults}</p>
          <p className="mb-4">
            Items with media: {testResults.itemsWithMedia.length}
          </p>

          {testResults.itemsWithMedia.length === 0 ? (
            <div className="bg-yellow-100 p-4 rounded mb-6">
              <p className="font-bold">No items with media found!</p>
              <p>
                This indicates there might be an issue with how we're processing
                the response.
              </p>
              <p>Check your browser console for detailed logging.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold mb-2">Items With Media</h2>

              {testResults.itemsWithMedia.map((item, index) => (
                <div key={index} className="mb-6 p-4 border rounded">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm mb-3">ID: {item.id}</p>

                  {item.media.map((media, mediaIndex) => (
                    <div
                      key={mediaIndex}
                      className="mb-4 p-3 bg-gray-50 rounded"
                    >
                      <p className="font-medium mb-1">
                        Media Item {mediaIndex + 1}
                      </p>
                      <p className="text-sm mb-1">Type: {media.type}</p>

                      {/* Original URL */}
                      {media.url && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Original URL:</p>
                          <p className="text-xs mb-1 break-all">{media.url}</p>
                          <p className="text-sm">
                            Status:{" "}
                            {imageResults[media.url] === undefined
                              ? "Testing..."
                              : imageResults[media.url]
                              ? "✅ Works"
                              : "❌ Failed"}
                          </p>

                          {imageResults[media.url] && (
                            <div className="mt-2 h-32 flex items-center justify-center">
                              <img
                                src={media.url}
                                alt="Original"
                                className="max-h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Thumbnail URL */}
                      {media.thumbnail && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">Thumbnail URL:</p>
                          <p className="text-xs mb-1 break-all">
                            {media.thumbnail}
                          </p>
                          <p className="text-sm">
                            Status:{" "}
                            {imageResults[media.thumbnail] === undefined
                              ? "Testing..."
                              : imageResults[media.thumbnail]
                              ? "✅ Works"
                              : "❌ Failed"}
                          </p>

                          {imageResults[media.thumbnail] && (
                            <div className="mt-2 h-32 flex items-center justify-center">
                              <img
                                src={media.thumbnail}
                                alt="Thumbnail"
                                className="max-h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* DeliveryService URL */}
                      {media.url && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">
                            DeliveryService URL:
                          </p>
                          {(() => {
                            const deliveryUrl = media.url.includes(
                              "deliveryService"
                            )
                              ? media.url
                              : media.url.replace(
                                  /\/ids\/[^\/]+\//,
                                  "/ids/deliveryService?id="
                                );
                            return (
                              <>
                                <p className="text-xs mb-1 break-all">
                                  {deliveryUrl}
                                </p>
                                <p className="text-sm">
                                  Status:{" "}
                                  {imageResults[deliveryUrl] === undefined
                                    ? "Testing..."
                                    : imageResults[deliveryUrl]
                                    ? "✅ Works"
                                    : "❌ Failed"}
                                </p>

                                {imageResults[deliveryUrl] && (
                                  <div className="mt-2 h-32 flex items-center justify-center">
                                    <img
                                      src={deliveryUrl}
                                      alt="DeliveryService"
                                      className="max-h-full object-contain"
                                    />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* IdsId-based URL */}
                      {media.idsId && (
                        <div className="mb-3">
                          <p className="text-sm font-medium">
                            IdsId-based URL:
                          </p>
                          {(() => {
                            const idsIdUrl = `https://ids.si.edu/ids/deliveryService?id=${media.idsId}`;
                            return (
                              <>
                                <p className="text-xs mb-1 break-all">
                                  {idsIdUrl}
                                </p>
                                <p className="text-sm">
                                  Status:{" "}
                                  {imageResults[idsIdUrl] === undefined
                                    ? "Testing..."
                                    : imageResults[idsIdUrl]
                                    ? "✅ Works"
                                    : "❌ Failed"}
                                </p>

                                {imageResults[idsIdUrl] && (
                                  <div className="mt-2 h-32 flex items-center justify-center">
                                    <img
                                      src={idsIdUrl}
                                      alt="IdsId-based"
                                      className="max-h-full object-contain"
                                    />
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SmithsonianImageTest;
