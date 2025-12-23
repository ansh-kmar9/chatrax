import { useState, useEffect } from "react";
import { X, MapPin, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function AuthModal({ mode: initialMode, onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    codeName: "",
    mobile: "",
    password: "",
    location: null,
  });

  const [codeNameStatus, setCodeNameStatus] = useState({
    checking: false,
    available: null,
  });

  useEffect(() => {
    if (mode === "register" && formData.codeName.length >= 3) {
      const timer = setTimeout(checkCodeName, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.codeName, mode]);

  const checkCodeName = async () => {
    setCodeNameStatus({ checking: true, available: null });
    try {
      const response = await axios.post("/api/auth/check-codename", {
        codeName: formData.codeName,
      });
      setCodeNameStatus({
        checking: false,
        available: response.data.available,
      });
    } catch (error) {
      setCodeNameStatus({ checking: false, available: null });
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
          setError("");
        },
        (error) => {
          setError("Location access is required for registration");
          toast.error("Please enable location access to register");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      toast.error("Your browser doesn't support geolocation");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!formData.location) {
          setError("Please allow location access");
          toast.warning("Location access is required");
          setLoading(false);
          return;
        }
        await register(formData);
      } else {
        await login(formData.codeName, formData.password);
      }
      // Small delay to ensure toast is visible before modal closes
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Authentication failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">CodeName</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.codeName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  codeName: e.target.value.toLowerCase(),
                })
              }
              placeholder="unique_codename"
            />
            {mode === "register" && formData.codeName.length >= 3 && (
              <p
                className={`text-sm mt-1 ${
                  codeNameStatus.checking
                    ? "text-gray-500"
                    : codeNameStatus.available
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {codeNameStatus.checking
                  ? "Checking..."
                  : codeNameStatus.available
                  ? "✓ Available"
                  : "✗ Already taken"}
              </p>
            )}
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                className="input-field"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="input-field pr-10"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <button
                type="button"
                onClick={getLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-lavender-300 dark:border-lavender-700 rounded-lg hover:bg-lavender-50 dark:hover:bg-lavender-900/20"
              >
                <MapPin className="w-5 h-5" />
                {formData.location
                  ? "✓ Location Captured"
                  : "Allow Location Access"}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Required for registration
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || (mode === "register" && !codeNameStatus.available)
            }
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-lavender-600 hover:underline"
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
