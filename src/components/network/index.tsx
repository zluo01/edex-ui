import Banner from '@/components/banner';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { lazy, Suspense, useContext, useEffect, useState } from 'react';

const NetworkContent = lazy(() => import('@/components/network/content'));

function Network() {
  const theme = useContext(ThemeContext);

  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, 200);

    return () => clearTimeout(timeout);
  }, [show]);

  return (
    <div
      className={classNames(
        theme.borderColor['30'],
        'relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3',
      )}
    >
      <Banner title={'PANEL'} name={'NETWORK'} />
      <Suspense>{show && <NetworkContent />}</Suspense>
    </div>
  );
}

export default Network;
