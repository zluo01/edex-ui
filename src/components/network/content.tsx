import Divider from '@/components/divider';
import DiskUsage from '@/components/network/disk';
import ConnectionStatus from '@/components/network/status';
import NetworkTraffic from '@/components/network/traffic';
import { createSignal, onCleanup } from 'solid-js';

function Network() {
  const [connected, isConnected] = createSignal<boolean>(navigator.onLine);

  const controller = new AbortController();

  addEventListener('online', () => isConnected(true), {
    signal: controller.signal,
  });
  addEventListener('offline', () => isConnected(false), {
    signal: controller.signal,
  });

  onCleanup(() => controller.abort());

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
