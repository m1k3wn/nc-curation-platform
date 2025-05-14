import { createContext, useContext, useState } from "react";

// Create the context
const AuthContext = createContext();

// Custom hook for using the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component
export function AuthProvider({ children }) {
  // Mock user state (in a real app, this would check localStorage/session)
  const [currentUser, setCurrentUser] = useState({
    id: "user123",
    username: "johnsmith",
    name: "John Smith",
    email: "john@example.com",
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Mock auth functions
  const login = (email, password) => {
    // In a real app, this would make an API call
    console.log(`Login attempt with ${email}`);
    setIsAuthenticated(true);
    setCurrentUser({
      id: "user123",
      username: "johnsmith",
      name: "John Smith",
      email: email,
    });
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const authValues = {
    currentUser,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>
  );
}
