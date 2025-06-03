import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCollections } from "../context/CollectionsContext";
import CollectionCard from "../components/collections/CollectionCard";

export default function UserProfilePage() {
  // Get the username from the URL parameter
  const { username } = useParams();
  const { currentUser } = useAuth();
  const { collections, loading, openCreateModal } = useCollections();

  // Check if viewing own profile
  const isOwnProfile = currentUser?.username === username;

  // Calculate stats
  const totalCollections = collections.length;
  const totalItems = collections.reduce(
    (sum, collection) => sum + collection.items.length,
    0
  );

  // Get recent collections (last 4, sorted by dateModified)
  const recentCollections = [...collections]
    .sort((a, b) => new Date(b.dateModified) - new Date(a.dateModified))
    .slice(0, 4);

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin"></div>
            <span className="ml-2 text-body">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="flex items-center mb-8">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-accent-primary rounded-full mr-6 flex items-center justify-center">
              <span className="text-2xl font-title text-white">
                {username.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Profile Info */}
            <div>
              <h1 className="text-title">{username}</h1>
              <p className="text-body text-gray-600">
                {isOwnProfile ? "Your Profile" : "Member since 2025"}
              </p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-main text-inverse rounded-lg p-6 text-center">
              <div className="text-4xl font-title text-accent-primary mb-2">
                {totalCollections}
              </div>
              <div className="text-body">
                {totalCollections === 1 ? "Collection" : "Collections"}
              </div>
            </div>
            <div className="bg-main text-inverse rounded-lg p-6 text-center">
              <div className="text-4xl font-title text-accent-primary mb-2">
                {totalItems}
              </div>
              <div className="text-body">
                {totalItems === 1 ? "Item" : "Items"}
              </div>
            </div>
          </div>

          {/* Recent Collections */}
          {collections.length > 0 ? (
            <div className="mb-8">
              <h2 className="text-subtitle mb-4">
                {isOwnProfile ? "Your Collections" : "Recent Collections"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentCollections.map((collection) => (
                  <CollectionCard key={collection.id} collection={collection} />
                ))}
              </div>

              {collections.length > 4 && (
                <div className="text-center mt-6">
                  <button
                    className="btn-action"
                    onClick={() => (window.location.href = "/collections")}
                  >
                    View All Collections
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-8 text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-subtitle text-gray-600 mb-2">
                No collections yet
              </h3>
              <p className="text-body text-gray-500 mb-4">
                {isOwnProfile
                  ? "Start building your first collection!"
                  : "This user hasn't created any collections yet."}
              </p>
              {isOwnProfile && (
                <button
                  className="btn-action"
                  onClick={() => openCreateModal(null)}
                >
                  Create Your First Collection
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
