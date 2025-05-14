import { useCollections } from "../context/CollectionsContext";
import { useAuth } from "../context/AuthContext";

export default function CollectionsPage() {
  const { collections, togglePublished, addCollection } = useCollections();
  const { currentUser } = useAuth();

  const handleCreateCollection = () => {
    // In a real app, this would open a modal or form
    const title = prompt("Enter collection name:");
    if (title) {
      addCollection({ title, itemCount: 0 });
    }
  };

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Collections</h1>
            <button
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={handleCreateCollection}
            >
              New Collection
            </button>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{collection.title}</h2>
                  <div className="flex items-center">
                    {collection.isPublished ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Private
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <span>{collection.itemCount} items</span>
                  <span>Updated {collection.lastUpdated}</span>
                </div>
                <div className="flex justify-between">
                  <button className="text-sm text-gray-600 hover:text-black">
                    Edit
                  </button>
                  <button
                    className="text-sm text-gray-600 hover:text-black"
                    onClick={() => togglePublished(collection.id)}
                  >
                    {collection.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State (hidden when collections exist) */}
          {collections.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">No Collections Yet</h2>
              <p className="text-gray-600 mb-6">
                Create your first collection to organize your content.
              </p>
              <button
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                onClick={handleCreateCollection}
              >
                Create Collection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
