import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-main border-b py-3">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="text-title text-accent-primary hover:text-inverse transition-colors duration-300">
            <Link to="/">CURA</Link>
          </div>

          {/* Navigation */}
          <nav>
            <ul className="flex space-x-6 ">
              <li>
                <Link to="/" className="nav-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="nav-link">
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
                <Link to="/collections" className="icon-circle ">
                  <span className="text-icon">C</span>
                </Link>

                {/* User account icon */}
                <Link
                  to={`/user/${currentUser.username}`}
                  className="icon-circle"
                >
                  <span className="text-icon">U</span>
                </Link>
              </>
            ) : (
              <button
                className="btn-action"
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
