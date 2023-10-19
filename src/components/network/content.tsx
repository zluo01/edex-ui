import Divider from '@/components/divider';
import DiskUsage from '@/components/network/disk';
import ConnectionStatus from '@/components/network/status';
import NetworkTraffic from '@/components/network/traffic';
import { Fragment } from 'react';

function NetworkContent() {
  return (
    <Fragment>
      <Divider />
      <ConnectionStatus />
      <Divider />
      <NetworkTraffic />
      <Divider />
      <DiskUsage />
    </Fragment>
  );
}

export default NetworkContent;
