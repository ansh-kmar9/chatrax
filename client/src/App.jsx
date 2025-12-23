import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lavender-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
        style={{ top: "1rem" }}
      />
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/chat" /> : <LandingPage />}
        />
        <Route
          path="/chat"
          element={user ? <ChatPage /> : <Navigate to="/" />}
        />
        <Route
          path="/admin"
          element={user?.isAdmin ? <AdminPage /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
