import React, { useState, useEffect, useRef } from 'react';
import API from '../../api.js';
import { showMessageNotification } from '../utils/notifications.js';
import RemoveUserModal from './RemoveUserModal';
import AddUserModal from './AddUserModal';

const ChatWindow = ({ selectedChat, currentUser, socket, onlineUsers, setNotificationCount, onBack, onGroupUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRemoveUsers, setShowRemoveUsers] = useState(false);
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat?._id) {
      fetchMessages();
      if (socket) {
        socket.emit('joinChat', selectedChat._id);
        
        // Handle new messages - add to state only via socket
        const handleNewMessage = (message) => {
          setMessages(prev => {
            if (prev.some(m => m._id === message._id)) {
              return prev;
            }
            return [...prev, message];
          });

          // If the incoming message is from another user, mark it read immediately on this client
          if (message.sender._id !== currentUser?._id) {
            const senderName = message.sender.name || 'Unknown';
            showMessageNotification(senderName, message.content, selectedChat._id, () => {
              window.focus();
            });

            // Update header notification count if not currently active chat
            if (selectedChat?._id !== message.chat._id && setNotificationCount) {
              setNotificationCount(prev => prev + 1);
            }

            API.post('/messages/read', { messageIds: [message._id] })
              .catch(error => console.error('Error marking incoming message as read:', error));
          }
        };

        // Handle message read status updates
        const handleMessagesRead = (data) => {
          const { messageIds, userId } = data;
          setMessages(prev => prev.map(msg => {
            if (messageIds.includes(msg._id) && !msg.readBy.includes(userId)) {
              return {
                ...msg,
                readBy: [...msg.readBy, userId]
              };
            }
            return msg;
          }));
        };

        socket.on('newMessage', handleNewMessage);
        socket.on('message received', handleNewMessage);
        socket.on('messagesRead', handleMessagesRead);
        
        // Handle typing indicators
        const handleTyping = (data) => {
          const { chatId, userName, isTyping } = data;
          if (chatId === selectedChat._id) {
            setTypingUsers(prev => {
              if (isTyping) {
                // Add user if not already typing
                if (!prev.includes(userName)) {
                  return [...prev, userName];
                }
                return prev;
              } else {
                // Remove user from typing list
                return prev.filter(name => name !== userName);
              }
            });
          }
        };

        const handleStopTyping = (data) => {
          const { chatId } = data;
          if (chatId === selectedChat._id) {
            setTypingUsers([]);
          }
        };

        socket.on('typing', handleTyping);
        socket.on('stop typing', handleStopTyping);
        
        return () => {
          socket.off('newMessage', handleNewMessage);
          socket.off('message received', handleNewMessage);
          socket.off('messagesRead', handleMessagesRead);
          socket.off('typing', handleTyping);
          socket.off('stop typing', handleStopTyping);
        };
      }
    }
  }, [selectedChat?._id, socket, currentUser?._id]);

  // ✅ Mark messages as read when chat is opened
  useEffect(() => {
    if (selectedChat?._id && messages.length > 0 && currentUser?._id) {
      // Get all message IDs that are not from current user and not already read by them
      const messageIdsToMark = messages
        .filter(msg => msg.sender._id !== currentUser._id && 
                        msg.readBy && 
                        !msg.readBy.includes(currentUser._id))
        .map(msg => msg._id);

      if (messageIdsToMark.length > 0) {
        // Call backend to mark these messages as read
        API.post('/messages/read', { messageIds: messageIdsToMark })
          .catch(error => console.error('Error marking messages as read:', error));
      }
    }
  }, [selectedChat?._id, messages.length, currentUser?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const res = await API.get(`/messages/${selectedChat._id}`);
      setMessages(res.data?.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (socket && selectedChat) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', {
          chatId: selectedChat._id,
          userName: currentUser?.name || 'Someone'
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stop typing', selectedChat._id);
      }, 3000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    const content = messageInput;
    setMessageInput('');
    setLoading(true);

    // Stop typing when sending message
    if (socket && selectedChat && isTyping) {
      setIsTyping(false);
      socket.emit('stop typing', selectedChat._id);
    }

    try {
      const res = await API.post('/messages', {
        content,
        chatId: selectedChat._id
      });

      // Emit to socket so all clients get the message via socket event
      if (socket) {
        socket.emit('new message', res.data.message);
      }
      // Don't add to state here - let the socket 'newMessage' event handle it
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(content);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedChat) {
    return (
      <div className="no-chat">
        <div className="no-chat-content">
          <h2>Welcome to WhatsApp</h2>
          <p>Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  const chatName = selectedChat.chatName || selectedChat.name;
  const chatAvatar = selectedChat.users?.[0]?.name?.[0] || selectedChat.avatar || 'U';

  // For one-on-one chats, show the other user's name
  let displayName = chatName;
  let statusText = 'offline';
  if (!selectedChat.isGroupChat && selectedChat.users && selectedChat.users.length > 0) {
    // Find the other user (not current user)
    const otherUser = selectedChat.users.find(u => u._id !== currentUser?._id);
    displayName = otherUser?.name || chatName;
    if (otherUser) {
      const isOnline = onlineUsers?.includes(otherUser._id);
      statusText = isOnline ? 'online' : 'offline';
    }
  } else if (selectedChat.isGroupChat) {
    const members = selectedChat.users?.map(u => u._id) || [];
    const onlineCount = members.filter(id => onlineUsers?.includes(id)).length;
    statusText = `${onlineCount}/${members.length} online`;
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="back-btn" onClick={onBack}>&larr;</button>
          <div className="avatar">{chatAvatar}</div>
          <div>
            <h3>{displayName}</h3>
            <p className={statusText.startsWith('online') ? 'online' : 'offline'}>{statusText}</p>
          </div>
        </div>
        <div className="chat-header-right">
          {selectedChat.isGroupChat && selectedChat.groupAdmin?._id === currentUser?._id && (
            <>
              <button className="add-user-btn" onClick={() => setShowAddUsers(true)}>
                Add Member
              </button>
              <button className="remove-user-btn" onClick={() => setShowRemoveUsers(true)}>
                Remove Member
              </button>
            </>
          )}
          <span>⋯</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '20px' }}>
            Start a conversation
          </div>
        ) : (
          messages.map((msg, idx) => {
            // Determine message status
            let statusIcon = '';
            let statusClass = '';
            const isMe = msg.sender._id === currentUser?._id;
            const readBy = msg.readBy || [];

            if (isMe) {
              // 1 tick: only me has read (sent)
              // 2 tick: at least one other user has read (delivered or seen)
              if (!selectedChat?.isGroupChat) {
                const otherUser = selectedChat?.users?.find(u => u._id !== currentUser?._id);
                const otherRead = otherUser ? readBy.includes(otherUser._id) : false;

                if (otherRead) {
                  statusIcon = '✓✓';
                  statusClass = 'seen';
                } else {
                  statusIcon = '✓';
                  statusClass = 'sent';
                }
              } else {
                // group chat: 1 tick => sent, 2 ticks (delivered) when at least one other has read, seen when all others read
                const totalOthers = (selectedChat.users?.length || 1) - 1;
                const readOthers = readBy.filter(id => id !== currentUser?._id).length;

                if (readOthers === 0) {
                  statusIcon = '✓';
                  statusClass = 'sent';
                } else if (readOthers < totalOthers) {
                  statusIcon = '✓✓';
                  statusClass = 'delivered';
                } else {
                  statusIcon = '✓✓';
                  statusClass = 'seen';
                }
              }
            }

            return (
              <div
                key={msg._id || idx}
                className={`message ${msg.sender._id === currentUser?._id ? 'sent' : 'received'}`}
              >
                <p>{msg.content}</p>
                <div className="message-footer">
                  <span className="time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender._id === currentUser?._id && (
                    <span className={`status-icon ${statusClass}`}>
                      {statusIcon}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {showRemoveUsers && (
        <RemoveUserModal
          chat={selectedChat}
          onRemove={(updatedChat) => {
            onGroupUpdate?.(updatedChat);
            setShowRemoveUsers(false);
          }}
          onClose={() => setShowRemoveUsers(false)}
        />
      )}

      {showAddUsers && (
        <AddUserModal
          chat={selectedChat}
          onAdd={(updatedChat) => {
            onGroupUpdate?.(updatedChat);
            setShowAddUsers(false);
          }}
          onClose={() => setShowAddUsers(false)}
        />
      )}

      {/* Message Input */}
      <form className="message-input-container" onSubmit={handleSendMessage}>
        <button type="button" className="input-icon">😀</button>
        <button type="button" className="input-icon">📎</button>
        <input 
          type="text" 
          placeholder="Type a message" 
          className="message-input"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="send-btn" disabled={loading}>
          {loading ? '...' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;