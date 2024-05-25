import Divider from '@/components/divider';
import Clock from '@/components/system/clock';
import CpuInfo from '@/components/system/cpuinfo';
import MemInfo from '@/components/system/meminfo';
import Process from '@/components/system/process';
import SysInfo from '@/components/system/sysinfo';

function MainContent() {
  return (
    <>
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
    </>
  );
}

export default MainContent;
