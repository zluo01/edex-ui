import Banner from '@/components/banner';
import { lazy, Suspense, useEffect, useState } from 'react';

const Content = lazy(() => import('@/components/system/content'));

function System() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(true);
    }, 200);

    return () => clearTimeout(timeout);
  }, [show]);

  return (
    <div className="relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3">
      <Banner title={'PANEL'} name={'SYSTEM'} />
      <Suspense>{show && <Content />}</Suspense>
    </div>
  );
}

export default System;
