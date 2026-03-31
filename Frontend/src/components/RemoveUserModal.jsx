import React, { useState } from 'react';
import API from '../../api.js';

const RemoveUserModal = ({ chat, onRemove, onClose }) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRemoveUser = async () => {
    if (!selectedUserId) {
      setError('Select a user to remove');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.put('/chats/groupremove', {
        chatId: chat._id,
        userId: selectedUserId
      });

      onRemove(res.data);
      setSelectedUserId('');
      onClose();
    } catch (error) {
      console.error('Error removing user:', error);
      setError(error.response?.data?.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const removableUsers = chat.users.filter(user => 
    user._id !== chat.groupAdmin._id
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Remove Member from {chat.chatName}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="user-list-modal">
          {removableUsers.map(user => (
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
          className="modal-submit-btn danger"
          onClick={handleRemoveUser}
          disabled={loading || !selectedUserId}
        >
          {loading ? 'Removing...' : 'Remove User'}
        </button>
      </div>
    </div>
  );
};

export default RemoveUserModal;
