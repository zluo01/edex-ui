import BaseInformation from '@/components/system/sysinfo/base';
import formatTime from '@/lib/utils/format';
import { Event, listen } from '@tauri-apps/api/event';
import { Fragment, useEffect, useState } from 'react';

function UpTimeSection() {
  const [uptime, setUptime] = useState<number>();

  useEffect(() => {
    const unListen = listen('uptime', (e: Event<number>) =>
      setUptime(e.payload),
    );

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, []);

  function UpTime() {
    if (!uptime) {
      return <>0:0:0</>;
    }

    let raw = uptime;

    const days = Math.floor(raw / 86400);
    raw -= days * 86400;

    const hours = Math.floor(raw / 3600);
    raw -= hours * 3600;

    const minutes = Math.floor(raw / 60);

    return (
      <Fragment>
        {days}
        <span className="opacity-50">d</span>
        {formatTime(hours)}
        <span className="opacity-50">:</span>
        {formatTime(minutes)}
      </Fragment>
    );
  }

  return <BaseInformation header={'UPTIME'} value={<UpTime />} />;
}

export default UpTimeSection;
