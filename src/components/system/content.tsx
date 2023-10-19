import Divider from '@/components/divider';
import Clock from '@/components/system/clock';
import CpuInfo from '@/components/system/cpuinfo';
import MemInfo from '@/components/system/meminfo';
import Process from '@/components/system/process';
import SysInfo from '@/components/system/sysinfo';
import { Fragment } from 'react';

function MainContent() {
  return (
    <Fragment>
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
    </Fragment>
  );
}

export default MainContent;
