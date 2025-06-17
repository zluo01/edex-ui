import DateSection from '@/components/system/sysinfo/date';
import Kernel from '@/components/system/sysinfo/kernel';
import UpTimeSection from '@/components/system/sysinfo/upTime';
import Version from '@/components/system/sysinfo/version';

function SysInfo() {
  return (
    <div class="font-united_sans_light flex h-[5.556vh] w-full flex-row items-center justify-around tracking-[0.092vh]">
      <DateSection />
      <UpTimeSection />
      <Kernel />
      <Version />
    </div>
  );
}

export default SysInfo;
