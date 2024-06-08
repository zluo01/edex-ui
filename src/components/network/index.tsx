import Banner from '@/components/banner';
import { useCurrentTheme } from '@/lib/themes';
import clsx from 'clsx';
import { lazy } from 'solid-js';

const NetworkContent = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return import('@/components/network/content');
});

function Network() {
  const theme = useCurrentTheme();

  return (
    <div
      class={clsx(
        theme().borderColor['30'],
        'relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3',
      )}
    >
      <Banner title={'PANEL'} name={'NETWORK'} />
      <NetworkContent />
    </div>
  );
}

export default Network;
