import { useCollections } from "../context/CollectionsContext";

export default function ExplorePage() {
  const { publicCollections } = useCollections();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-4">Discover Collections</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore curated collections shared by the community.
            </p>
          </div>

          {/* Search/Filter Bar */}
          <div className="mb-8 flex justify-center">
            <input
              type="text"
              placeholder="Search collections..."
              className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          {/* Published Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicCollections.map((collection) => (
              <div
                key={collection.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {collection.title}
                </h2>
                <div className="text-sm text-gray-600 mb-4">
                  <div>By @{collection.owner}</div>
                  <div className="mt-1">
                    {collection.itemCount} items • {collection.likes} likes
                  </div>
                </div>
                <button className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                  View Collection
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
