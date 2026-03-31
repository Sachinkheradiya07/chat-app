import React, { useState, useEffect } from 'react';
import API from '../../api.js';

const GroupCreateModal = ({ onGroupCreate, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all users from new /all endpoint
      const res = await API.get('/users/all');
      setAllUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = allUsers.filter(user => 
    !selectedUsers.some(selected => selected._id === user._id) &&
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('Select at least 2 users');
      return;
    }

    setLoading(true);
    try {
      const userIds = selectedUsers.map(u => u._id);
      const res = await API.post('/chats/group', {
        name: groupName,
        users: userIds
      });

      onGroupCreate(res.data.chat);
      setGroupName('');
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
      setError(error.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Create Group Chat</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleCreateGroup} style={{ padding: '0 12px' }}>
          {error && <div className="error-message">{error}</div>}

          <input
            type="text"
            placeholder="Group name..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="modal-input"
          />

          <div className="selected-users">
            {selectedUsers.map(user => (
              <div key={user._id} className="selected-user-tag">
                <span>{user.name}</span>
                <button
                  type="button"
                  className="remove-user-btn"
                  onClick={() => handleRemoveUser(user._id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search and add users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modal-input search-input"
          />

          {(searchTerm || loadingUsers) && (
            <div className="user-suggestions">
              {loadingUsers && <p className="no-suggestions">Loading users...</p>}
              
              {!loadingUsers && filteredUsers.map(user => (
                <div
                  key={user._id}
                  className="suggestion-item"
                  onClick={() => handleAddUser(user)}
                >
                  <div className="suggestion-avatar">{user.name?.[0] || 'U'}</div>
                  <div>
                    <div className="suggestion-name">{user.name}</div>
                    <div className="suggestion-email">{user.email}</div>
                  </div>
                </div>
              ))}
              {!loadingUsers && filteredUsers.length === 0 && (
                <p className="no-suggestions">No matching users</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="modal-submit-btn"
            disabled={loading || selectedUsers.length < 2}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupCreateModal;
