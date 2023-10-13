import Banner from '@/components/banner';
import Divider from '@/components/divider';
import Clock from '@/components/system/clock';
import CpuInfo from '@/components/system/cpuinfo';
import MemInfo from '@/components/system/meminfo';
import Process from '@/components/system/process';
import SysInfo from '@/components/system/sysinfo';

function System() {
  // Todo make border color static
  return (
    <div className="relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3">
      <Banner title={'PANEL'} name={'SYSTEM'} />
      <Divider />
      <Clock />
      <Divider />
      <SysInfo />
      <Divider />
      <CpuInfo />
      <Divider />
      <MemInfo />
      <Divider />
      <Process />
    </div>
  );
}

export default System;
