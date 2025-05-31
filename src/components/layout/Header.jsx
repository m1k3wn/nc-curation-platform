import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-black border-b border-gray-200 py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo placeholder*/}
          <div className="font-bold text-xl">
            <Link to="/" className="text-white hover:text-green-600">
              CURA
            </Link>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="flex space-x-6 ">
              <li>
                <Link to="/" className="text-white hover:text-green-600 ">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white hover:text-green-600 ">
                  About
                </Link>
              </li>
            </ul>
          </nav>

          {/* Icons*/}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Collections icon */}
                <Link
                  to="/collections"
                  className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <span className="font-bold">C</span>
                </Link>

                {/* User account icon */}
                <Link
                  to={`/user/${currentUser.username}`}
                  className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                >
                  <span className="font-bold">U</span>
                </Link>
              </>
            ) : (
              <button
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => alert("Sign in functionality would open here")}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
