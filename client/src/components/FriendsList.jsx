import { useState } from "react";
import { Circle, RefreshCw, Search, X } from "lucide-react";

function FriendsList({
  friends,
  selectedFriend,
  onSelectFriend,
  onRefresh,
  unreadCounts = {},
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter friends based on search query
  const filteredFriends = friends.filter(
    (friend) =>
      friend.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.codeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="glass-effect rounded-2xl p-8 inline-block">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lavender-400 to-purple-500 rounded-full flex items-center justify-center">
            <Circle className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold mb-2">
            No friends yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Search for users and send friend requests
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-lavender-500 dark:focus:border-lavender-400 rounded-xl text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/50">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {searchQuery
            ? `Found (${filteredFriends.length})`
            : `Friends (${friends.length})`}
        </p>
        <button
          onClick={onRefresh}
          className="p-2 hover:bg-lavender-100 dark:hover:bg-lavender-900/20 rounded-lg transition-all duration-200 group"
          title="Refresh friends list"
        >
          <RefreshCw className="w-4 h-4 text-lavender-600 dark:text-lavender-400 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/50">
        {filteredFriends.length === 0 ? (
          <div className="p-6 text-center">
            <Search className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No friends found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          filteredFriends.map((friend) => {
            return (
              <button
                key={friend._id}
                onClick={() => onSelectFriend(friend)}
                className={`w-full p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:bg-gradient-to-r hover:from-lavender-50 hover:to-purple-50 dark:hover:from-lavender-900/20 dark:hover:to-purple-900/20 ${
                  selectedFriend?._id === friend._id
                    ? "bg-gradient-to-r from-lavender-100 to-purple-100 dark:from-lavender-900/30 dark:to-purple-900/30 border-l-4 border-lavender-500"
                    : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div className="avatar-glow w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-br from-lavender-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base shadow-lg">
                    {friend.fullName[0].toUpperCase()}
                  </div>
                  {friend.isOnline && (
                    <Circle className="absolute bottom-0 right-0 w-3 h-3 fill-green-500 text-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-bold text-sm sm:text-base truncate text-gray-800 dark:text-white">
                    {friend.fullName}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                    @{friend.codeName}
                  </p>
                </div>
                {unreadCounts[friend._id] > 0 && (
                  <div className="flex-shrink-0 animate-slideIn">
                    <span className="relative flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs font-bold items-center justify-center shadow-lg">
                        {unreadCounts[friend._id] > 9
                          ? "9+"
                          : unreadCounts[friend._id]}
                      </span>
                    </span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default FriendsList;
