import Divider from '@/components/divider';
import Clock from '@/components/system/clock';
import MemInfo from '@/components/system/meminfo';
import Process from '@/components/system/process';
import SysInfo from '@/components/system/sysinfo';
import HardwareInfo from 'src/components/system/hardwareInfo';

function MainContent() {
  return (
    <>
      <Divider />
      <Clock />
      <Divider />
      <SysInfo />
      <Divider />
      <HardwareInfo />
      <Divider />
      <MemInfo />
      <Divider />
      <Process />
    </>
  );
}

export default MainContent;
