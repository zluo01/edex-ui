import BaseInformation from '@/components/network/status/base';
import { getNetworkLatency } from '@/lib/os';
import useGetNetworkConnection from '@/lib/utils/network';
import { useEffect, useState } from 'react';

function Latency() {
  const connection = useGetNetworkConnection();

  const [latency, setLatency] = useState('--');

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!connection) {
        setLatency('--');
      }

      getNetworkLatency()
        .then(v => setLatency(v.toString()))
        .catch(e => {
          console.error(e);
          setLatency('--');
        });
    }, 1000);

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, [connection]);

  return <BaseInformation header={'PING'} value={`${latency}ms`} />;
}

export default Latency;
