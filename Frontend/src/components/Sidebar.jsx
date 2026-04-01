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
    <div className="sidebar card border-end h-100">
      <div className="sidebar-header d-flex justify-content-between align-items-center p-3 border-bottom">
        <div className="user-info d-flex align-items-center gap-2">
          <div className="avatar">{currentUser?.name?.[0] || "U"}</div>
          <span className="fw-bold">{currentUser?.name || "My Account"}</span>
        </div>
        <div className="header-icons d-flex gap-2">
          <button className="icon-btn btn btn-sm btn-light" onClick={() => setShowUserSearch(true)} title="New chat">✚</button>
          <button className="icon-btn btn btn-sm btn-light" onClick={() => setShowGroupModal(true)} title="Create group">👥</button>
        </div>
      </div>

      <div className="search-bar p-2 border-bottom">
        <input
          type="text"
          className="form-control rounded-pill"
          placeholder="Search chats, users, groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="chat-list flex-grow-1 overflow-auto">
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
              className={`chat-item d-flex p-3 border-bottom cursor-pointer ${selectedChat?._id === chat._id ? 'active bg-light border-start border-5 border-primary' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
                  <div className="avatar me-2">
                {chat.users?.[0]?.name?.[0] || chat.chatName?.[0] || "U"}
              </div>
              <div className="chat-info flex-grow-1 min-width-0">
                <div className="chat-name d-flex align-items-center gap-2">
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