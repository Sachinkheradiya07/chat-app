import React from 'react';

export const Header = ({ currentUser, onLogout, notificationCount = 0, onMenuClick }) => {
  const handleNotificationClick = () => {
    // Can be used to open notifications panel
    console.log('Notifications clicked');
  };

  return (
    <div className="app-header navbar navbar-dark bg-gradient">
      <div className="header-left d-flex align-items-center gap-3">
        <button className="menu-btn btn btn-link text-white" aria-label="Open menu" onClick={onMenuClick}>☰</button>
        <div className="user-profile d-flex align-items-center gap-2">
          <div className="profile-photo">{currentUser?.name?.[0] || "U"}</div>
          <div className="profile-meta d-flex flex-column">
            <div className="profile-name fw-bold">{"YOU"}</div>
            <div className="profile-status small">Online</div>
          </div>
        </div>
      </div>

      <div className="header-right d-flex gap-2">
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
