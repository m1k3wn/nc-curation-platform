import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
// Page Imports
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import UserProfilePage from "../pages/UserProfilePage";
import CollectionsPage from "../pages/CollectionsPage";
import SearchResultsPage from "../pages/SearchResultsPage";
import ExplorePage from "../pages/ExplorePage";
import { AuthProvider } from "../context/AuthContext";
import { CollectionsProvider } from "../context/CollectionsContext";
import { SearchProvider } from "../context/SearchContext";

export default function App() {
  return (
    <AuthProvider>
      <CollectionsProvider>
        <SearchProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />

              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/user/:username" element={<UserProfilePage />} />
                  <Route path="/collections" element={<CollectionsPage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/search" element={<SearchResultsPage />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </Router>
        </SearchProvider>
      </CollectionsProvider>
    </AuthProvider>
  );
}
