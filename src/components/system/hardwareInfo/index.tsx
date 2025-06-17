import CpuLoad from '@/components/system/hardwareInfo/cpuLoad';
import Temperature from '@/components/system/hardwareInfo/temperature';

function CpuInfo() {
  return (
    <div class="font-united_sans_light flex w-full flex-col items-center justify-between space-y-1 tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <CpuLoad />
      <div class="border-default/30 h-0 w-[95%] border-t-2 border-dashed" />
      <Temperature />
    </div>
  );
}

export default CpuInfo;
