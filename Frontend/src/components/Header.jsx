import React from 'react';

export const Header = ({ currentUser, onLogout, notificationCount = 0, onMenuClick }) => {
  const handleNotificationClick = () => {
    // Can be used to open notifications panel
    console.log('Notifications clicked');
  };

  return (
    <div className="app-header">
      <div className="header-left">
        <button className="menu-btn" aria-label="Open menu" onClick={onMenuClick}>☰</button>
        <div className="user-profile">
          <div className="profile-photo">{currentUser?.name?.[0] || "U"}</div>
          <div className="profile-meta">
            <div className="profile-name">{currentUser?.name || "Guest User"}</div>
            <div className="profile-status">Online</div>
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="notification-icon-wrapper">
          <button 
            className="notification-icon-btn"
            onClick={handleNotificationClick}
            title="Notifications"
          >
            🔔
          </button>
          {notificationCount > 0 && (
            <span className="notification-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
          )}
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
};
