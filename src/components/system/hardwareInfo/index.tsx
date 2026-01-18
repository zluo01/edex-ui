import Load from '@/components/system/hardwareInfo/load.tsx';

function CpuInfo() {
  return (
    <div class="font-united_sans_light flex w-full flex-col items-center justify-between space-y-1 tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <Load />
    </div>
  );
}

export default CpuInfo;
