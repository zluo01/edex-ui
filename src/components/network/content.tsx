import Divider from '@/components/divider';
import DiskUsage from '@/components/network/disk';
import ConnectionStatus from '@/components/network/status';
import NetworkTraffic from '@/components/network/traffic';
import { createSignal, onCleanup } from 'solid-js';

function Network() {
  const [connected, isConnected] = createSignal<boolean>(navigator.onLine);

  async function onOnline() {
    isConnected(true);
  }

  function onOffline() {
    isConnected(false);
  }

  addEventListener('online', onOnline);
  addEventListener('offline', onOffline);

  onCleanup(() => {
    removeEventListener('online', onOnline);
    removeEventListener('offline', onOffline);
  });

  return (
    <>
      <ConnectionStatus connected={connected} />
      <Divider />
      <NetworkTraffic connected={connected} />
    </>
  );
}
function NetworkContent() {
  return (
    <>
      <Divider />
      <Network />
      <Divider />
      <DiskUsage />
    </>
  );
}

export default NetworkContent;
