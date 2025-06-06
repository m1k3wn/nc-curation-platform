import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { useAutoAnimate } from "./utils/useAutoAnimate";

// Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import UserProfilePage from "./pages/UserProfilePage";
import CollectionsPage from "./pages/CollectionsPage";
import CollectionView from "./pages/CollectionView";
import SearchResultsPage from "./pages/SearchResultsPage";
import ItemPage from "./pages/ItemPage";

// Context providers
import { AuthProvider } from "./context/AuthContext";
import { CollectionsProvider } from "./context/CollectionsContext";
import { SearchProvider } from "./context/SearchContext";

/**
 * Main application component that sets up routing and context providers
 */
export default function App() {
  const [animateRef] = useAutoAnimate();

  return (
    <AuthProvider>
      <CollectionsProvider>
        <Router>
          <SearchProvider>
            <div className="min-h-screen flex flex-col">
              <Header />

              <main className="flex-grow" ref={animateRef}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/user/:username" element={<UserProfilePage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route
                    path="/collections/:collectionId"
                    element={<CollectionView />}
                  />
                  <Route path="/search" element={<SearchResultsPage />} />
                  <Route path="/item/:source/:id" element={<ItemPage />} />
                  {/* Catch-all route for 404 errors */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </SearchProvider>
        </Router>
      </CollectionsProvider>
    </AuthProvider>
  );
}

/**
 * 404 Not Found page component
 */
function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        href="/"
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
}
