import { useEffect, useState } from 'react';

export default function FlashMessage({ message, type = 'success' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    if (!message) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div className={`flash-message flash-${type}`}>
      {message}
      <button className="flash-close" onClick={() => setVisible(false)}>&times;</button>
    </div>
  );
}
