// Notification utility functions

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

export const showNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return;
  }

  if (Notification.permission === 'granted') {
    const defaultOptions = {
      icon: 'https://via.placeholder.com/100x100.png?text=Chat',
      badge: 'https://via.placeholder.com/30x30.png?text=C',
      tag: 'chat-notification', // Replaces previous notification
      requireInteraction: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Play sound
      playNotificationSound();

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

export const playNotificationSound = () => {
  try {
    // Use Web Audio API to play a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export const showMessageNotification = (sender, message, chatId, onClick) => {
  const title = `New message from ${sender}`;
  const notification = showNotification(title, {
    body: message.substring(0, 100), // Limit message length
    data: { chatId },
  });

  if (notification && onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }

  return notification;
};
