import React, { useState } from 'react';
import API from '../../api.js';

const UserSearch = ({ onUserSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearch(query);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await API.get(`/users/search?search=${query}`);
      setResults(res.data.users || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    try {
      const res = await API.post('/chats/access', { userId: user._id });
      onUserSelect(res.data);
      setSearch('');
      setResults([]);
      onClose();
    } catch (error) {
      console.error('Error accessing chat:', error);
    }
  };

  return (
    <div className="user-search-modal">
      <div className="search-modal-content">
        <div className="search-modal-header">
          <h3>Start New Chat</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={handleSearch}
          className="search-input-modal"    
          autoFocus
        />

        <div className="search-results">
          {loading && <p className="loading-text">Searching...</p>}
          
          {results.length === 0 && search && !loading && (
            <p className="no-results">No users found</p>
          )}

          {results.map((user) => (
            <div
              key={user._id}
              className="search-result-item"
              onClick={() => handleSelectUser(user)}
            >
              <div className="result-avatar">
                {user.name?.[0] || 'U'}
              </div>
              <div className="result-info">
                <div className="result-name">{user.name}</div>
                <div className="result-email">{user.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserSearch;
