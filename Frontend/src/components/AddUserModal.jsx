import React, { useState, useEffect } from 'react';
import API from '../../api.js';

const AddUserModal = ({ chat, onAdd, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const res = await API.get('/users/all');
        setAllUsers(res.data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
        setAllUsers([]);
      }
    };
    fetchAllUsers();
  }, []);

  const availableUsers = allUsers
    .filter(user => !(chat.users || []).some(u => u._id === user._id))
    .filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const handleAddUser = async () => {
    if (!selectedUserId) {
      setError('Select user to add');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await API.put('/chats/groupadd', {
        chatId: chat._id,
        userId: selectedUserId
      });
      onAdd(res.data.chat);
      setSelectedUserId('');
      onClose();
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Member to {chat.chatName}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <input
          type="text"
          placeholder="Search users by name/email" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="modal-input"
        />

        <div className="user-list-modal" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          {availableUsers.length === 0 && (
            <div className="no-suggestions">No users available to add</div>
          )}
          {availableUsers.map(user => (
            <div
              key={user._id}
              className={`user-item-modal ${selectedUserId === user._id ? 'selected' : ''}`}
              onClick={() => setSelectedUserId(user._id)}
            >
              <div className="user-item-avatar">{user.name?.[0] || 'U'}</div>
              <div className="user-item-info">
                <div className="user-item-name">{user.name}</div>
                <div className="user-item-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="modal-submit-btn"
          onClick={handleAddUser}
          disabled={loading || !selectedUserId}
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </div>
    </div>
  );
};

export default AddUserModal;
