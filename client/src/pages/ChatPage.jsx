import { useState, useEffect, useRef, useCallback } from "react";
import {
  Moon,
  Sun,
  LogOut,
  Users as UsersIcon,
  MessageSquare,
  Search,
  UserPlus,
  Shield,
  Menu,
  ArrowLeft,
  User,
  X,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ChatWindow from "../components/ChatWindow";
import FriendsList from "../components/FriendsList";
import SearchUsers from "../components/SearchUsers";
import FriendRequests from "../components/FriendRequests";
import { FriendsListSkeleton } from "../components/SkeletonLoader";

function ChatPage() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { socket, isAuthenticated } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("friends");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Refs for stable access in callbacks
  const selectedFriendRef = useRef(null);
  const userRef = useRef(null);

  // Keep refs in sync
  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Only load data after socket is authenticated
    if (isAuthenticated) {
      loadFriends();
      loadFriendRequests();
      loadUnreadCount();
      loadUnreadCounts();
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768 && selectedFriend) {
        setShowSidebar(false);
      } else if (window.innerWidth >= 768) {
        setShowSidebar(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedFriend, isAuthenticated]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleFriendRequest = () => {
      loadFriendRequests();
    };

    const handleFriendRequestResponse = () => {
      loadFriends();
    };

    const handleNewMessage = (data) => {
      if (!data?.message) return;

      // Normalize IDs to strings - handle both _id and id formats
      const senderId = String(
        data.message.sender?._id ||
          data.message.sender?.id ||
          data.message.sender ||
          ""
      );
      const receiverId = String(
        data.message.receiver?._id ||
          data.message.receiver?.id ||
          data.message.receiver ||
          ""
      );
      const currentUserId = String(
        userRef.current?._id || userRef.current?.id || ""
      );
      const currentFriendId = String(selectedFriendRef.current?._id || "");

      console.log(
        `[CHAT PAGE] New message: ${senderId} -> ${receiverId}, me: ${currentUserId}, chatWith: ${currentFriendId}`
      );

      // Don't increment for messages I sent
      if (senderId === currentUserId) {
        return;
      }

      // Only increment unread if message is not from currently open chat
      if (senderId !== currentFriendId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      const odId = String(userId);
      console.log(
        `[CHAT PAGE] Status update: ${userId} is ${
          isOnline ? "ONLINE" : "OFFLINE"
        }`
      );

      // Update friends list
      setFriends((prev) =>
        prev.map((f) =>
          String(f._id) === odId
            ? { ...f, isOnline, lastSeen: lastSeen || f.lastSeen }
            : f
        )
      );

      // Update selected friend if applicable
      setSelectedFriend((prev) => {
        if (prev && String(prev._id) === odId) {
          return { ...prev, isOnline, lastSeen: lastSeen || prev.lastSeen };
        }
        return prev;
      });
    };

    const handleMessagesRead = ({ readBy }) => {
      const odId = String(readBy);
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        const removedCount = updated[odId] || 0;
        delete updated[odId];
        setUnreadCount((current) => Math.max(0, current - removedCount));
        return updated;
      });
    };

    socket.on("friend-request", handleFriendRequest);
    socket.on("friend-request-response", handleFriendRequestResponse);
    socket.on("new-message", handleNewMessage);
    socket.on("user-status", handleUserStatus);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("friend-request", handleFriendRequest);
      socket.off("friend-request-response", handleFriendRequestResponse);
      socket.off("new-message", handleNewMessage);
      socket.off("user-status", handleUserStatus);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socket, isAuthenticated, selectedFriend?._id]);

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const response = await axios.get("/api/users/friends");
      console.log("[LOAD FRIENDS] Response:", response.data);
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error("Error loading friends:", error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await axios.get("/api/friends/requests");
      setFriendRequests(response.data.requests);
    } catch (error) {
      console.error("Error loading friend requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await axios.get("/api/chats/unread/count");
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const response = await axios.get("/api/chats/unread/per-friend");
      setUnreadCounts(response.data.unreadCounts);
    } catch (error) {
      console.error("Error loading unread counts:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    // Small delay to ensure toast is visible before navigation
    setTimeout(() => {
      navigate("/");
    }, 100);
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
    if (isMobile) {
      setShowSidebar(false);
    }
    // Clear unread count for this friend when opening chat
    const friendId = String(friend._id);
    setUnreadCounts((prev) => {
      const updated = { ...prev };
      const removedCount = updated[friendId] || 0;
      delete updated[friendId];

      // Update total count immediately
      if (removedCount > 0) {
        setUnreadCount((current) => Math.max(0, current - removedCount));
      }

      return updated;
    });
  };

  const handleBackToList = () => {
    setSelectedFriend(null);
    setShowSidebar(true);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-lavender-50 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed inset-0 z-40 bg-white dark:bg-gray-900 transition-transform duration-300 ${
                showSidebar ? "translate-x-0" : "-translate-x-full"
              }`
            : "w-80 border-r border-gray-200/50 dark:border-gray-700/50"
        } flex flex-col backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="glass-effect p-4 border-b border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-lavender-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-lavender-600 to-purple-600 dark:from-lavender-400 dark:to-purple-400 bg-clip-text text-transparent">
                ChatraX
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {user?.isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                  title="Admin Panel"
                >
                  <Shield className="w-5 h-5 text-lavender-600 group-hover:text-purple-600 transition-colors" />
                </button>
              )}
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
                title="My Profile"
              >
                <User className="w-5 h-5 text-lavender-600 group-hover:text-purple-600 transition-colors" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-lavender-600" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 text-red-500 hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="glass-effect rounded-xl p-3 bg-gradient-to-r from-lavender-50 to-purple-50 dark:from-lavender-900/20 dark:to-purple-900/20">
            <p className="font-bold text-gray-800 dark:text-white">
              {user?.fullName}
            </p>
            <p className="text-sm text-lavender-600 dark:text-lavender-400 font-semibold">
              @{user?.codeName}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/50 dark:border-gray-700/50 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 px-2 sm:px-4 py-3 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-semibold transition-all duration-200 relative ${
              activeTab === "friends"
                ? "border-b-2 border-lavender-600 text-lavender-600 bg-lavender-50/50 dark:bg-lavender-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-lavender-600 dark:hover:text-lavender-400"
            }`}
          >
            <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Friends</span>
            {Object.keys(unreadCounts).length > 0 && (
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 animate-slideIn">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs items-center justify-center shadow-lg font-bold">
                    {Object.keys(unreadCounts).length}
                  </span>
                </span>
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 px-2 sm:px-4 py-3 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base font-semibold transition-all duration-200 ${
              activeTab === "search"
                ? "border-b-2 border-lavender-600 text-lavender-600 bg-lavender-50/50 dark:bg-lavender-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-lavender-600 dark:hover:text-lavender-400"
            }`}
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 px-2 sm:px-4 py-3 flex items-center justify-center gap-1 sm:gap-2 relative text-sm sm:text-base font-semibold transition-all duration-200 ${
              activeTab === "requests"
                ? "border-b-2 border-lavender-600 text-lavender-600 bg-lavender-50/50 dark:bg-lavender-900/20"
                : "text-gray-600 dark:text-gray-400 hover:text-lavender-600 dark:hover:text-lavender-400"
            }`}
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Requests</span>
            {friendRequests.length > 0 && (
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 animate-slideIn">
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs items-center justify-center shadow-lg font-bold">
                    {friendRequests.length}
                  </span>
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "friends" &&
            (loadingFriends ? (
              <FriendsListSkeleton count={6} />
            ) : (
              <FriendsList
                friends={friends}
                selectedFriend={selectedFriend}
                onSelectFriend={handleSelectFriend}
                onRefresh={loadFriends}
                unreadCounts={unreadCounts}
              />
            ))}
          {activeTab === "search" && (
            <SearchUsers onFriendAdded={loadFriendRequests} />
          )}
          {activeTab === "requests" && (
            <FriendRequests
              requests={friendRequests}
              onRequestHandled={() => {
                loadFriendRequests();
                loadFriends();
              }}
              loading={loadingRequests}
            />
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`${
          isMobile ? (selectedFriend ? "flex-1" : "hidden") : "flex-1"
        }`}
      >
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            onBack={handleBackToList}
            isMobile={isMobile}
          />
        ) : (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center animate-fadeIn">
              <div className="glass-effect rounded-3xl p-12 inline-block">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-lavender-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl animate-pulse">
                  <MessageSquare className="w-10 h-10 text-white" />
                </div>
                <p className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Start a Conversation
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  Select a friend to begin chatting
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal ? (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 99999,
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative h-28 bg-gradient-to-br from-lavender-400 via-purple-500 to-lavender-600">
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Avatar */}
            <div className="flex justify-center -mt-14">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-lavender-300 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-gray-900 shadow-xl">
                  {user?.fullName?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
            </div>

            {/* Content */}
            <div className="px-5 pb-5 pt-3">
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {user?.fullName}
                </h3>
                <p className="text-lavender-600 dark:text-lavender-400 font-medium text-sm">
                  @{user?.codeName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-lavender-50 dark:bg-lavender-900/20 rounded-xl p-3 text-center">
                  <UsersIcon className="w-5 h-5 text-lavender-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    {friends.length}
                  </p>
                  <p className="text-xs text-gray-500">Friends</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1 animate-pulse" />
                  <p className="text-lg font-bold text-gray-800 dark:text-white">
                    Online
                  </p>
                  <p className="text-xs text-gray-500">Status</p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <User className="w-4 h-4 text-lavender-500" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Full Name</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {user?.fullName}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-3 bg-gradient-to-r from-lavender-500 to-purple-600 hover:from-lavender-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ChatPage;
