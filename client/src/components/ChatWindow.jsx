import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Circle,
  ArrowLeft,
  Smile,
  CheckCheck,
  ArrowDown,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import EmojiPicker from "emoji-picker-react";
import { MessagesLoadingSkeleton, ChatHeaderSkeleton } from "./SkeletonLoader";

function ChatWindow({
  friend: initialFriend,
  onBack,
  isMobile,
  onStatusChange,
}) {
  const { socket, isAuthenticated } = useSocket();
  const { user } = useAuth();
  const [friend, setFriend] = useState(initialFriend);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Stable references for callbacks
  const friendIdRef = useRef(initialFriend?._id);
  const userIdRef = useRef(user?._id || user?.id);

  // Update refs when values change
  useEffect(() => {
    friendIdRef.current = friend?._id;
  }, [friend?._id]);

  useEffect(() => {
    userIdRef.current = user?._id || user?.id;
  }, [user?._id, user?.id]);

  // Sync friend state with prop
  useEffect(() => {
    if (initialFriend?._id !== friend?._id) {
      setFriend(initialFriend);
      setMessages([]);
      setLoadingMessages(true);
      setShowScrollButton(false); // Reset scroll button when switching chats
    } else {
      // Update online status without resetting messages
      setFriend((prev) => ({
        ...prev,
        isOnline: initialFriend?.isOnline,
        lastSeen: initialFriend?.lastSeen,
      }));
    }
  }, [initialFriend]);

  // Load messages when friend changes
  useEffect(() => {
    if (friend?._id) {
      loadMessages();
    }
  }, [friend?._id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isAuthenticated || !friend?._id) {
      return;
    }

    const handleNewMessage = (data) => {
      const message = data.message;
      const currentFriendId = String(friendIdRef.current || "");
      const currentUserId = String(userIdRef.current || "");

      if (!message || !currentFriendId || !currentUserId) return;

      // Normalize IDs to strings for comparison
      const senderId = String(message.sender?._id || message.sender || "");
      const receiverId = String(
        message.receiver?._id || message.receiver || ""
      );

      const isFromFriend = senderId === currentFriendId;
      const isToFriend = receiverId === currentFriendId;
      const isFromMe = senderId === currentUserId;
      const isToMe = receiverId === currentUserId;

      // Message is relevant if it's between me and the current friend
      const isRelevant = (isFromFriend && isToMe) || (isFromMe && isToFriend);

      if (!isRelevant) return;

      console.log("[CHAT] New message for this conversation:", message._id);

      setMessages((prev) => {
        // Check for duplicate by ID
        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }

        // Replace temp message if exists
        const tempIndex = prev.findIndex(
          (m) => m.sending && m.content === message.content && isFromMe
        );

        if (tempIndex !== -1) {
          const updated = [...prev];
          updated[tempIndex] = message;
          return updated;
        }

        return [...prev, message];
      });

      // Mark as read if from friend
      if (isFromFriend) {
        markMessagesAsRead();
      }
    };

    const handleTyping = ({ userId, isTyping: typing }) => {
      if (String(userId) === String(friendIdRef.current)) {
        setIsTyping(typing);
      }
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      if (String(userId) === String(friendIdRef.current)) {
        setFriend((prev) => ({
          ...prev,
          isOnline,
          lastSeen: lastSeen || prev?.lastSeen,
        }));
        // Notify parent component
        if (onStatusChange) {
          onStatusChange(userId, isOnline, lastSeen);
        }
      }
    };

    const handleMessageSent = ({ message, tempId }) => {
      if (!message) return;

      setMessages((prev) => {
        // Replace temp message
        const idx = prev.findIndex((m) => m._id === tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = message;
          return updated;
        }
        // Or add if not found (shouldn't happen normally)
        if (!prev.some((m) => m._id === message._id)) {
          return [...prev, message];
        }
        return prev;
      });
    };

    console.log("[CHAT] Setting up socket listeners for:", friend.fullName);

    socket.on("new-message", handleNewMessage);
    socket.on("user-typing", handleTyping);
    socket.on("user-status", handleUserStatus);
    socket.on("message-sent", handleMessageSent);

    return () => {
      console.log("[CHAT] Cleaning up socket listeners");
      socket.off("new-message", handleNewMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-status", handleUserStatus);
      socket.off("message-sent", handleMessageSent);
    };
  }, [socket, isAuthenticated, friend?._id, onStatusChange]);

  // Track if this is initial load
  const isInitialLoadRef = useRef(true);

  // Scroll to bottom on new messages
  useEffect(() => {
    const container = messagesContainerRef.current;

    // Always scroll to bottom on initial load or when switching chats
    if (isInitialLoadRef.current && messages.length > 0) {
      scrollToBottom(false); // instant scroll
      isInitialLoadRef.current = false;
      return;
    }

    if (!container) {
      scrollToBottom();
      return;
    }

    // Only auto-scroll if already near bottom (for new incoming messages)
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Reset initial load flag when friend changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [friend?._id]);

  // Emoji picker outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll button visibility
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    // Check initially after a small delay
    const timer = setTimeout(() => {
      handleScroll();
    }, 500);

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [messages]); // Re-run when messages change

  const loadMessages = async () => {
    if (!friend?._id) return;

    try {
      setLoadingMessages(true);
      const response = await axios.get(`/api/chats/${friend._id}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      if (error.response?.status !== 403) {
        toast.error("Failed to load messages");
      }
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markMessagesAsRead = useCallback(async () => {
    if (!friend?._id) return;
    try {
      await axios.put(`/api/chats/mark-read/${friend._id}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [friend?._id]);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const handleTyping = useCallback(() => {
    if (!socket || !friend?._id) return;

    socket.emit("typing", { receiverId: friend._id, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", { receiverId: friend._id, isTyping: false });
    }, 1000);
  }, [socket, friend?._id]);

  const sendMessage = async (e) => {
    e.preventDefault();

    const content = newMessage.trim();
    if (!content) return;

    const userId = user?._id || user?.id;
    const friendId = friend?._id;

    if (!userId || !friendId) {
      toast.error("Unable to send message. Please try refreshing the page.");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const tempMessage = {
      _id: tempId,
      content,
      sender: { _id: userId, fullName: user.fullName },
      receiver: { _id: friendId, fullName: friend.fullName },
      createdAt: new Date().toISOString(),
      sending: true,
    };

    // Add temp message immediately
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");
    setShowEmojiPicker(false);

    try {
      // Send via REST API (socket broadcast happens on server)
      const response = await axios.post("/api/chats", {
        receiverId: friendId,
        content,
      });

      // Replace temp message with actual
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m._id === tempId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = response.data.message;
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setNewMessage(content);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 overflow-hidden relative">
      {/* Header */}
      <div className="glass-effect p-3 sm:p-4 border-b border-white/10 flex items-center gap-2 sm:gap-3 backdrop-blur-xl shadow-lg flex-shrink-0">
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2.5 hover:bg-lavender-500/10 rounded-xl transition-all duration-200 group"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-lavender-600 dark:group-hover:text-lavender-400 transition-colors" />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <div className="avatar-glow w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gradient-to-br from-lavender-400 via-purple-500 to-lavender-600 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base md:text-lg shadow-lg">
            {friend.fullName[0].toUpperCase()}
          </div>
          {friend.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm sm:text-base md:text-lg truncate text-gray-800 dark:text-white">
            {friend.fullName}
          </p>
          <p className="text-xs sm:text-sm font-medium flex items-center gap-1">
            {friend.isOnline ? (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Active now
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Offline</span>
            )}
          </p>
        </div>
      </div>

      {/* Messages Area - wrapper for scroll container and floating button */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        {loadingMessages ? (
          <MessagesLoadingSkeleton />
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No messages yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Start the conversation!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  // Normalize IDs to strings - handle both _id and id formats
                  const getSenderId = () => {
                    if (!msg.sender) return "";
                    if (typeof msg.sender === "string") return msg.sender;
                    return String(msg.sender._id || msg.sender.id || "");
                  };

                  const getCurrentUserId = () => {
                    if (!user) return "";
                    return String(user._id || user.id || "");
                  };

                  const senderId = getSenderId();
                  const currentUserId = getCurrentUserId();
                  const isOwn =
                    senderId && currentUserId && senderId === currentUserId;
                  const isSending = msg.sending;

                  return (
                    <div
                      key={msg._id || index}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      } w-full min-w-0 animate-slideInSmooth`}
                      style={{
                        paddingLeft: "0.25rem",
                        paddingRight: "0.25rem",
                      }}
                    >
                      <div
                        className={`message-bubble inline-block max-w-[90%] xs:max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-lg transition-all duration-300 ${
                          isSending
                            ? "opacity-70 animate-messagePulse"
                            : "opacity-100"
                        } ${
                          isOwn
                            ? "bg-gradient-to-br from-lavender-500 to-purple-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700"
                        }`}
                        style={{
                          wordBreak: "break-word",
                          overflowWrap: "break-word",
                        }}
                      >
                        <p
                          className="text-[13px] sm:text-sm md:text-base break-words whitespace-pre-wrap leading-relaxed"
                          style={{ margin: 0, padding: 0 }}
                        >
                          {msg.content}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <p
                            className={`text-[10px] sm:text-xs ${
                              isOwn
                                ? "text-white/80"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {isOwn && !isSending && (
                            <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80" />
                          )}
                          {isSending && (
                            <Circle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/60 animate-spin" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {isTyping && (
                <div className="flex justify-start animate-fadeIn px-1">
                  <div className="glass-effect rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-lg">
                    <div className="flex gap-1.5">
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-lavender-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-lavender-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-lavender-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </div>

      {/* Scroll to Bottom Button - Fixed position */}
      {showScrollButton && messages.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "25px",
            zIndex: 99999,
          }}
        >
          <button
            onClick={() => scrollToBottom()}
            style={{
              width: "56px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#9333ea",
              color: "white",
              borderRadius: "50%",
              border: "4px solid #ffffff",
              boxShadow:
                "0 6px 30px rgba(147, 51, 234, 0.8), 0 4px 15px rgba(0,0,0,0.5)",
              cursor: "pointer",
            }}
            aria-label="Scroll to bottom"
            title="Go to latest messages"
          >
            <ArrowDown size={28} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="glass-effect p-2 sm:p-3 md:p-4 border-t border-white/10 backdrop-blur-xl flex-shrink-0"
      >
        <div className="relative">
          <div className="flex gap-1 sm:gap-1.5 md:gap-2 items-center">
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1.5 sm:p-2 md:p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-lavender-600 dark:hover:text-lavender-400"
              >
                <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full mb-2 left-0 z-50 shadow-2xl rounded-2xl overflow-hidden"
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    theme={
                      document.documentElement.classList.contains("dark")
                        ? "dark"
                        : "light"
                    }
                    searchPlaceHolder="Search emoji..."
                    width={window.innerWidth < 400 ? 260 : 280}
                    height={window.innerWidth < 400 ? 300 : 350}
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              className="input-field flex-1 min-w-0 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 focus:border-lavender-500 dark:focus:border-lavender-400 transition-all duration-200 px-2.5 py-2 sm:px-3 sm:py-2.5"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
            />
            <button
              type="submit"
              className="btn-primary flex-shrink-0 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-lavender-500 to-purple-600 hover:from-lavender-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatWindow;
