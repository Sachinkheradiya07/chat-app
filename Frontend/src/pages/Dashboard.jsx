// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Header } from '../components/Header';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import API from '../../api.js';
import { requestNotificationPermission } from '../utils/notifications.js';

const Dashboard = ({ currentUser, onLogout }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  useEffect(() => {
    // Request notification permission on dashboard load
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log('Notifications enabled');
      }
    });

    // Initialize socket connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (currentUser?._id) {
        newSocket.emit('setup', currentUser._id);
      }
    });

    newSocket.on('connected', () => {
      console.log('User setup complete');
    });

    newSocket.on('userOnline', (userId) => {
      setOnlineUsers(prev => prev.includes(userId) ? prev : [...prev, userId]);
    });

    newSocket.on('userOffline', (userId) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Listen for incoming messages to update notification count
    newSocket.on('newMessage', (message) => {
      if (message.sender._id !== currentUser?._id) {
        // Only increment if message is from a different chat than currently selected
        if (!selectedChat || message.chat._id !== selectedChat._id) {
          setNotificationCount(prev => prev + 1);
        }
      }
    });

    // Listen for messages being read
    newSocket.on('messagesRead', (data) => {
      console.log('Messages read by user:', data.userId);
    });

    setSocket(newSocket);
    fetchChats();

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?._id, selectedChat]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1000;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await API.get('/chats');
      const payload = res.data;
      let chatsFromServer = [];

      if (payload && Array.isArray(payload.chats)) {
        chatsFromServer = payload.chats;
      } else if (payload && payload.success && payload.chat && typeof payload.chat === 'object') {
        chatsFromServer = [payload.chat];
      } else {
        console.warn('Unexpected chats response:', payload);
      }

      setChats(chatsFromServer);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Header currentUser={currentUser} onLogout={onLogout} notificationCount={notificationCount} onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
      
      <div className={`whatsapp-app ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Sidebar 
          currentUser={currentUser}
          selectedChat={selectedChat}
          setSelectedChat={(chat) => {
            setSelectedChat(chat);
            if (isMobile) {
              setIsSidebarOpen(false);
            }
            setNotificationCount(0);
          }}
          chats={chats}
          setChats={setChats}
          onlineUsers={onlineUsers}
        />

        {(isSidebarOpen && isMobile) && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

        <ChatWindow 
          selectedChat={selectedChat}
          currentUser={currentUser}
          socket={socket}
          onlineUsers={onlineUsers}
          setNotificationCount={setNotificationCount}
          onBack={() => setIsSidebarOpen(true)}
          onGroupUpdate={(updatedChat) => {
            setChats(prev => prev.map(chat => chat._id === updatedChat._id ? updatedChat : chat));
            setSelectedChat(updatedChat);
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;