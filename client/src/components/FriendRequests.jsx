import { Check, X, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { FriendRequestsLoadingSkeleton } from "./SkeletonLoader";

function FriendRequests({ requests, onRequestHandled, loading = false }) {
  const handleRequest = async (requestId, status) => {
    try {
      await axios.put(`/api/friends/request/${requestId}`, { status });
      toast.success(
        status === "accepted"
          ? "Friend request accepted!"
          : "Friend request rejected"
      );
      onRequestHandled();
    } catch (error) {
      toast.error("Failed to handle request");
    }
  };

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="glass-effect rounded-2xl p-8 inline-block">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-lavender-400 to-purple-500 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-semibold">
            No pending requests
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            You're all caught up!
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <FriendRequestsLoadingSkeleton count={3} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800/50">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Pending Requests ({requests.length})
        </p>
        <button
          onClick={onRequestHandled}
          className="p-2 hover:bg-lavender-100 dark:hover:bg-lavender-900/20 rounded-lg transition-all duration-200 group"
          title="Refresh requests"
        >
          <RefreshCw className="w-4 h-4 text-lavender-600 dark:text-lavender-400 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/50 p-3 sm:p-4 space-y-3">
        {requests.map((request) => (
          <div
            key={request._id}
            className="glass-effect p-4 sm:p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 animate-slideIn"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar-glow w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-lavender-400 to-purple-600 rounded-full flex items-center justify-center font-bold text-white text-base sm:text-lg shadow-lg flex-shrink-0">
                {request.sender.fullName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm sm:text-base truncate text-gray-800 dark:text-white">
                  {request.sender.fullName}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate font-medium">
                  @{request.sender.codeName}
                </p>
                <p className="text-xs text-lavender-600 dark:text-lavender-400 mt-1 font-semibold">
                  Wants to connect with you
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => handleRequest(request._id, "accepted")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <Check className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={() => handleRequest(request._id, "rejected")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FriendRequests;
