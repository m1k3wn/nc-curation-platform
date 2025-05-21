import { useCollections } from "../context/CollectionsContext";
import CollectionCard from "../components/collections/CollectionCard";
import EmptyCollectionsList from "../components/collections/EmptyCollectionsList";

export default function CollectionsPage() {
  const { collections, loading, error, openCreateModal } = useCollections();

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Collections</h1>
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading collections...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Collections</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Collections</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={openCreateModal}
        >
          + New Collection
        </button>
      </div>

      {/* Collections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.length === 0 ? (
          <EmptyCollectionsList />
        ) : (
          collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))
        )}
      </div>
    </div>
  );
}
