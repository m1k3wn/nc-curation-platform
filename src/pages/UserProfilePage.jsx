import { useParams } from "react-router-dom";

export default function UserProfilePage() {
  // Get the username from the URL parameter
  const { username } = useParams();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Profile Header */}
          <div className="flex items-center mb-8">
            {/* Profile Picture */}
            <div className="w-24 h-24 bg-gray-200 rounded-full mr-6"></div>

            {/* Profile Info */}
            <div>
              <h1 className="text-3xl font-bold">{username}</h1>
              <p className="text-gray-600">Member since 2025</p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-gray-600">Collections</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">48</div>
              <div className="text-gray-600">Items</div>
            </div>
            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">156</div>
              <div className="text-gray-600">Followers</div>
            </div>
          </div>

          {/* Recent Collections */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Recent Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold mb-1">Collection {item}</h3>
                  <p className="text-gray-600 text-sm">
                    12 items • Updated yesterday
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* User Bio */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">About</h2>
            <p className="text-gray-600">
              This is a sample user bio. Here the user can share information
              about themselves, their interests, and what kind of content they
              collect.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
