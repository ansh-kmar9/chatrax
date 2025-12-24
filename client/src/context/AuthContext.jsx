import { createContext, useState, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.PROD
  ? "https://chatrax.onrender.com"
  : "";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await axios.get("/api/users/me");
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (codeName, password) => {
    // Get current location
    let location = null;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 0,
        });
      });
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err) {
      console.log("Location not available:", err.message);
    }

    const response = await axios.post("/api/auth/login", {
      codeName,
      password,
      location,
    });
    localStorage.setItem("token", response.data.token);
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.data.token}`;
    setUser(response.data.user);
    toast.success(`Welcome back, ${response.data.user.fullName}!`);
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post("/api/auth/register", userData);
    localStorage.setItem("token", response.data.token);
    axios.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${response.data.token}`;
    setUser(response.data.user);
    toast.success(`Welcome to ChatraX, ${response.data.user.fullName}! 🎉`);
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      toast.info("You've been logged out. See you soon!");
    } catch (error) {
      // Still logout on client side even if server request fails
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      toast.info("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
