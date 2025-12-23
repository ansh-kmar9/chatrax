import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Trash2,
  Users,
  MessageSquare,
  Activity,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AdminUsersListSkeleton,
  FriendsListSkeleton,
} from "../components/SkeletonLoader";

function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineUsers: 0,
    totalMessages: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingUsers(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get("/api/admin/users"),
        axios.get("/api/admin/stats"),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserMessages = async (userId) => {
    try {
      setLoadingFriends(true);
      const response = await axios.get(`/api/admin/users/${userId}/friends`);
      setFriends(response.data.friends);
      setSelectedUser(userId);
      setSelectedFriend(null);
      setMessages([]);
      setActiveTab("friends");
    } catch (error) {
      console.error("Error loading friends:", error);
      toast.error("Failed to load user's friends");
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadChatMessages = async (friendId) => {
    try {
      setLoadingMessages(true);
      const response = await axios.get(
        `/api/admin/chats/${selectedUser}/${friendId}`
      );
      setMessages(response.data.messages);
      setSelectedFriend(friendId);
      setActiveTab("messages");
    } catch (error) {
      console.error("Error loading chat messages:", error);
      toast.error("Failed to load chat messages");
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteUser = async (userId) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      setUsers(users.filter((u) => u._id !== userId));
      if (selectedUser === userId) {
        setSelectedUser(null);
        setSelectedFriend(null);
        setFriends([]);
        setMessages([]);
      }
      toast.success("User deleted successfully");
      loadData();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-lavender-600 text-white p-4 sm:p-6">
        <div className="container mx-auto">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 mb-3 sm:mb-4 hover:opacity-80"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Back to Chat</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-6">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-lavender-100 dark:bg-lavender-900 rounded-lg">
                <Users className="w-8 h-8 text-lavender-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Users
                </p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Online Users
                </p>
                <p className="text-3xl font-bold">{stats.onlineUsers}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Total Messages
                </p>
                <p className="text-3xl font-bold">{stats.totalMessages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("users");
              setSelectedUser(null);
              setSelectedFriend(null);
              setFriends([]);
              setMessages([]);
            }}
            className={`px-3 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base ${
              activeTab === "users"
                ? "border-b-2 border-lavender-600 text-lavender-600"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Users Management
          </button>
          {selectedUser && (
            <button
              onClick={() => setActiveTab("friends")}
              className={`px-3 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === "friends"
                  ? "border-b-2 border-lavender-600 text-lavender-600"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Friends List
            </button>
          )}
          {selectedFriend && (
            <button
              onClick={() => setActiveTab("messages")}
              className={`px-3 sm:px-4 py-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === "messages"
                  ? "border-b-2 border-lavender-600 text-lavender-600"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Chat Messages
            </button>
          )}
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">All Users</h2>
            {loadingUsers ? (
              <AdminUsersListSkeleton count={6} />
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          user.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          @{user.codeName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {user.mobile}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => loadUserMessages(user._id)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-lavender-600 text-white rounded-lg hover:bg-lavender-700"
                      >
                        View Friends
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {selectedUser
                  ? `${
                      users.find((u) => u._id === selectedUser)?.fullName
                    }'s Friends`
                  : "Friends List"}
              </h2>
              <button
                onClick={() => {
                  setActiveTab("users");
                  setSelectedUser(null);
                  setFriends([]);
                }}
                className="text-sm text-lavender-600 hover:text-lavender-700"
              >
                ← Back to Users
              </button>
            </div>
            {loadingFriends ? (
              <FriendsListSkeleton count={5} />
            ) : friends.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                This user has no friends yet
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          friend.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">
                          {friend.fullName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          @{friend.codeName}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {friend.mobile}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => loadChatMessages(friend._id)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 text-sm sm:text-base bg-lavender-600 text-white rounded-lg hover:bg-lavender-700"
                    >
                      View Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Chat Messages</h2>
              <button
                onClick={() => {
                  setActiveTab("friends");
                  setSelectedFriend(null);
                  setMessages([]);
                }}
                className="text-sm text-lavender-600 hover:text-lavender-700"
              >
                ← Back to Friends
              </button>
            </div>
            {loadingMessages ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No messages found between these users
              </p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold">
                        {msg.sender.fullName} → {msg.receiver.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
