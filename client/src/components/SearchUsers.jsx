import { useState } from "react";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { SearchLoadingSkeleton } from "./SkeletonLoader";

function SearchUsers({ onFriendAdded }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `/api/users/search?codeName=${searchQuery}`
      );
      setResults(response.data.users);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post("/api/friends/request", { receiverId: userId });
      setSentRequests(new Set([...sentRequests, userId]));
      toast.success("Friend request sent!");
      onFriendAdded();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="p-3 sm:p-4">
      <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-lavender-400" />
            <input
              type="text"
              placeholder="Search by codename..."
              className="input-field pl-12 w-full rounded-2xl bg-white/50 dark:bg-gray-800/50 border-2 border-gray-200/50 dark:border-gray-700/50 focus:border-lavender-500 dark:focus:border-lavender-400 shadow-lg transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || loading}
            className="px-5 py-2.5 bg-gradient-to-r from-lavender-500 to-purple-600 hover:from-lavender-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </form>

      {loading ? (
        <SearchLoadingSkeleton count={4} />
      ) : (
        <div className="space-y-3">
          {results.map((user) => (
            <div
              key={user._id}
              className="glass-effect p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg hover:shadow-xl transition-all duration-200 animate-slideIn"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="avatar-glow w-12 h-12 bg-gradient-to-br from-lavender-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white shadow-lg flex-shrink-0">
                  {user.fullName[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate text-gray-800 dark:text-white">
                    {user.fullName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                    @{user.codeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => sendFriendRequest(user._id)}
                disabled={
                  user.friendshipStatus === "friends" ||
                  user.friendshipStatus === "sent" ||
                  user.friendshipStatus === "received" ||
                  sentRequests.has(user._id)
                }
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm sm:text-base font-semibold shadow-lg transition-all duration-200 ${
                  user.friendshipStatus === "friends"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default"
                    : user.friendshipStatus === "sent" ||
                      sentRequests.has(user._id)
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
                    : user.friendshipStatus === "received"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-default"
                    : "bg-gradient-to-r from-lavender-500 to-purple-600 hover:from-lavender-600 hover:to-purple-700 text-white hover:shadow-xl"
                }`}
              >
                {user.friendshipStatus === "friends" ? (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Already Friends
                  </>
                ) : user.friendshipStatus === "sent" ||
                  sentRequests.has(user._id) ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Request Sent
                  </>
                ) : user.friendshipStatus === "received" ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Pending Request
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Friend
                  </>
                )}
              </button>
            </div>
          ))}
          {!loading && results.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className="glass-effect rounded-2xl p-8 inline-block">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 font-semibold">
                  No users found
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Try a different codename
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchUsers;
