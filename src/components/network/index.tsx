import Banner from '@/components/banner';
import Divider from '@/components/divider';
import DiskUsage from '@/components/network/disk';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { useContext } from 'react';
import ConnectionStatus from 'src/components/network/status';
import NetworkTraffic from 'src/components/network/traffic';

function Network() {
  const theme = useContext(ThemeContext);
  return (
    <div
      className={classNames(
        theme.borderColor['30'],
        'relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3',
      )}
    >
      <Banner title={'PANEL'} name={'NETWORK'} />
      <Divider />
      <ConnectionStatus />
      <Divider />
      <NetworkTraffic />
      <Divider />
      <DiskUsage />
    </div>
  );
}

export default Network;
