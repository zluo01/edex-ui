import BaseInformation from '@/components/system/sysinfo/base';
import formatTime from '@/lib/utils/format';
import { Event, listen } from '@tauri-apps/api/event';
import { createSignal, JSX, onCleanup } from 'solid-js';

function UpTimeSection() {
  const [uptime, setUptime] = createSignal<number>();

  const unListen = listen('uptime', (e: Event<number>) => setUptime(e.payload));

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
  });

  const UpTime = (): JSX.Element => {
    if (!uptime()) {
      return <>0:0:0</>;
    }

    let raw = uptime()!;

    const days = Math.floor(raw / 86400);
    raw -= days * 86400;
    const hours = Math.floor(raw / 3600);
    raw -= hours * 3600;
    const minutes = Math.floor(raw / 60);
    return (
      <>
        {days}
        <span class="opacity-50">d</span>
        {formatTime(hours)}
        <span class="opacity-50">:</span>
        {formatTime(minutes)}
      </>
    );
  };

  return <BaseInformation header={'UPTIME'} value={UpTime} />;
}

export default UpTimeSection;
