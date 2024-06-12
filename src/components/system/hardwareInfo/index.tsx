import CpuLoad from '@/components/system/hardwareInfo/cpuLoad';
import Temperature from '@/components/system/hardwareInfo/temperature';
import { useCurrentTheme } from '@/lib/themes';
import clsx from 'clsx';

function CpuInfo() {
  const theme = useCurrentTheme();

  return (
    <div class="flex w-full flex-col items-center justify-between space-y-1 font-united_sans_light tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <CpuLoad theme={theme} />
      <div
        class={clsx(
          theme().borderColor['30'],
          'h-0 w-[95%] border-t-2 border-dashed',
        )}
      />
      <Temperature />
    </div>
  );
}

export default CpuInfo;
