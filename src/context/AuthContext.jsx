import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Mock user state (in future, this will be fetched from a Firebase backend)
  const [currentUser, setCurrentUser] = useState({
    id: "user123",
    username: "johnsmith",
    name: "John Smith",
    email: "john@example.com",
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Mock auth function
  const login = (email, password) => {
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
