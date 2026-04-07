import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const AuthContext = createContext(null);

// Create axios instance that won't be intercepted by visual-edits
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { "Content-Type": "application/json" }
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("sonar-token"));
  const [loading, setLoading] = useState(true);

  // Restore session from stored token
  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMe = async (jwt) => {
    try {
      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setUser(res.data);
      setToken(jwt);
      // Sync avatar to localStorage so LandingPage picks it up
      if (res.data?.avatar_url) {
        localStorage.setItem("sonar-profile-photo", res.data.avatar_url);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      localStorage.removeItem("sonar-token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/api/auth/register", { name, email, password });
      localStorage.setItem("sonar-token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      throw new Error(msg);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("sonar-token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      if (res.data.user?.avatar_url) {
        localStorage.setItem("sonar-profile-photo", res.data.user.avatar_url);
      }
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.detail || "Login failed";
      throw new Error(msg);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("sonar-token");
    setToken(null);
    setUser(null);
  }, []);

  const restoreFromToken = useCallback(async (jwt) => {
    try {
      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      localStorage.setItem("sonar-token", jwt);
      setToken(jwt);
      setUser(res.data);
      if (res.data?.avatar_url) {
        localStorage.setItem("sonar-profile-photo", res.data.avatar_url);
      }
    } catch (err) {
      console.error("restoreFromToken failed:", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, restoreFromToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
