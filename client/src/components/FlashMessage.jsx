import { useEffect, useState } from 'react';

export default function FlashMessage({ message, type = 'success' }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || !message) return null;

  return (
    <div className={`flash-message flash-${type}`}>
      {message}
      <button className="flash-close" onClick={() => setVisible(false)}>&times;</button>
    </div>
  );
}
