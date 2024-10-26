import BaseInformation from '@/components/system/sysinfo/base';
import { errorLog } from '@/lib/log';
import { formatTime } from '@/lib/utils';
import { Event, listen } from '@tauri-apps/api/event';
import { createSignal, JSX, onCleanup, Show } from 'solid-js';

function UpTimeSection() {
  const [uptime, setUptime] = createSignal<number>();

  const unListen = listen('uptime', (e: Event<number>) => setUptime(e.payload));

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
  });

  function UpTime(): JSX.Element {
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
  }

  return (
    <BaseInformation
      header={/*@once*/ 'UPTIME'}
      value={
        <Show when={uptime()} fallback={<>0:0:0</>}>
          <UpTime />
        </Show>
      }
    />
  );
}

export default UpTimeSection;
