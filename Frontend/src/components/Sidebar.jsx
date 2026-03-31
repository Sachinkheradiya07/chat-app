import React, { useState, useEffect } from 'react';
import API from '../../api.js';
import UserSearch from './UserSearch';
import GroupCreateModal from './GroupCreateModal';

const Sidebar = ({ currentUser, selectedChat, setSelectedChat, chats = [], setChats = () => {}, onlineUsers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    setFilteredChats(
      chats.filter(chat => 
        chat.chatName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (chat.users && chat.users.some(user => 
          user.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      )
    );
  }, [searchTerm, chats]);

  const handleUserSelect = (chat) => {
    setChats([chat, ...chats.filter(c => c._id !== chat._id)]);
    setSelectedChat(chat);
    setShowUserSearch(false);
  };

  const handleGroupCreate = (group) => {
    setChats([group, ...chats]);
    setSelectedChat(group);
    setShowGroupModal(false);
  };

  const displayChats = chats;
  const chatList = searchTerm ? filteredChats : displayChats;

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="avatar">{currentUser?.name?.[0] || "U"}</div>
          <span>{currentUser?.name || "My Account"}</span>
        </div>
        <div className="header-icons">
          <button className="icon-btn" onClick={() => setShowUserSearch(true)}>✚</button>
          <button className="icon-btn" onClick={() => setShowGroupModal(true)}>👥</button>
        </div>
      </div>

      

      <div className="chat-list">
        {(Array.isArray(chatList) ? chatList : []).map((chat) => {
          // For one-on-one chats, show the other user's name
          let displayChatName = chat.chatName || chat.name;
          if (!chat.isGroupChat && chat.users && chat.users.length > 0) {
            const otherUser = chat.users.find(u => u._id !== currentUser?._id);
            displayChatName = otherUser?.name || displayChatName;
          }

          return (
            <div
              key={chat._id || chat.id}
              className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
                  <div className="avatar">
                {chat.users?.[0]?.name?.[0] || chat.chatName?.[0] || "U"}
              </div>
              <div className="chat-info">
                <div className="chat-name">
                <span className="chat-title-text">{displayChatName}</span>
                {chat.users && chat.users.length > 0 && (() => {
                  if (chat.isGroupChat) {
                    const onlineCount = chat.users.filter(u => onlineUsers.includes(u._id)).length;
                    return (
                      <span className="online-indicator group">{onlineCount}/{chat.users.length} online</span>
                    );
                  }

                  const otherUser = chat.users.find(u => u._id !== currentUser?._id);
                  const isOnline = otherUser && onlineUsers.includes(otherUser._id);
                  return (
                    <span className={`online-indicator ${isOnline ? 'online' : 'offline'}`}>
                      {isOnline ? 'online' : 'offline'}
                    </span>
                  );
                })()}
              </div>
                <div className="last-message">
                  {chat.latestMessage?.content || "No messages"}
                </div>
              </div>
              <div className="chat-meta">
                <div className="time">{chat.time}</div>
                {chat.unread > 0 && <div className="unread">{chat.unread}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showUserSearch && (
        <UserSearch 
          onUserSelect={handleUserSelect} 
          onClose={() => setShowUserSearch(false)}
        />
      )}

      {showGroupModal && (
        <GroupCreateModal 
          onGroupCreate={handleGroupCreate}
          onClose={() => setShowGroupModal(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;