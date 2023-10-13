import { useEffect, useState } from 'react';

export default function useGetNetworkConnection() {
  const [connection, setConnection] = useState(navigator.onLine);

  async function onOnline() {
    setConnection(true);
  }

  function onOffline() {
    setConnection(false);
  }

  useEffect(() => {
    addEventListener('online', onOnline);
    addEventListener('offline', onOffline);

    return () => {
      removeEventListener('online', onOnline);
      removeEventListener('offline', onOffline);
    };
  }, []);

  return connection;
}
