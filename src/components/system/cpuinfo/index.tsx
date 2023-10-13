import CpuLoad from '@/components/system/cpuinfo/load';
import SystemTemperature from '@/components/system/cpuinfo/temperature';
import classNames from '@/lib/utils/style';
import { ICPUData } from '@/models';
import ThemeContext from '@/themes/provider';
import { Event, listen } from '@tauri-apps/api/event';
import { useContext, useEffect, useState } from 'react';

function CpuInfo() {
  const theme = useContext(ThemeContext);

  const [data, setData] = useState<ICPUData>();

  useEffect(() => {
    const unListen = listen('load', (e: Event<ICPUData>) => setData(e.payload));

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, []);

  function getCPUName() {
    if (!data) {
      return '';
    }
    const cpuName = data.name.split('CPU')[0];
    return cpuName
      .replace(/\(R\)/g, '®')
      .replace(/\(TM\)/g, '™')
      .trim();
  }

  return (
    <div className="flex w-full flex-col items-center justify-between space-y-1 font-united_sans_light tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div className="flex w-full flex-row flex-nowrap items-center justify-between">
        <span className="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
          CPU USAGE
        </span>
        <span className="opacity-50 sm:text-xxs md:text-sm lg:text-xl xl:text-2xl">
          {getCPUName()}
        </span>
      </div>
      <CpuLoad {...data} />
      <div
        className={classNames(
          theme.borderColor['30'],
          'h-0 w-[95%] border-t-2 border-dashed',
        )}
      />
      <SystemTemperature temperature={data?.temperature} />
    </div>
  );
}

export default CpuInfo;
