// Skeleton Loader Components

// Friend Item Skeleton
export function FriendSkeleton() {
  return (
    <div className="w-full p-3 sm:p-4 flex items-center gap-3 animate-pulse">
      <div className="w-11 h-11 sm:w-13 sm:h-13 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );
}

// Message Skeleton
export function MessageSkeleton({ isOwn = false }) {
  return (
    <div
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      } animate-pulse`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 sm:p-4 space-y-2 ${
          isOwn
            ? "bg-lavender-200 dark:bg-lavender-900/30"
            : "bg-gray-200 dark:bg-gray-700"
        }`}
      >
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>
    </div>
  );
}

// Friend Request Skeleton
export function FriendRequestSkeleton() {
  return (
    <div className="glass-effect p-4 sm:p-5 rounded-2xl shadow-lg animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
    </div>
  );
}

// Search Result Skeleton
export function SearchResultSkeleton() {
  return (
    <div className="glass-effect p-4 sm:p-5 rounded-2xl shadow-lg animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        <div className="w-24 sm:w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
      </div>
    </div>
  );
}

// Chat Header Skeleton
export function ChatHeaderSkeleton() {
  return (
    <div className="glass-effect p-4 border-b border-white/10 flex items-center gap-3 backdrop-blur-xl shadow-lg animate-pulse">
      <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  );
}

// Full Friends List Skeleton
export function FriendsListSkeleton({ count = 5 }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
      {[...Array(count)].map((_, i) => (
        <FriendSkeleton key={i} />
      ))}
    </div>
  );
}

// Full Messages Skeleton
export function MessagesLoadingSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
      <MessageSkeleton isOwn={true} />
      <MessageSkeleton isOwn={false} />
    </div>
  );
}

// Search Loading Skeleton
export function SearchLoadingSkeleton({ count = 3 }) {
  return (
    <div className="p-3 sm:p-4 space-y-3">
      {[...Array(count)].map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
    </div>
  );
}

// Friend Requests Loading Skeleton
export function FriendRequestsLoadingSkeleton({ count = 2 }) {
  return (
    <div className="p-3 sm:p-4 space-y-3">
      {[...Array(count)].map((_, i) => (
        <FriendRequestSkeleton key={i} />
      ))}
    </div>
  );
}

// Admin User List Skeleton
export function AdminUserSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-700 gap-3 animate-pulse">
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <div className="flex-1 sm:flex-none w-28 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
}

export function AdminUsersListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <AdminUserSkeleton key={i} />
      ))}
    </div>
  );
}
