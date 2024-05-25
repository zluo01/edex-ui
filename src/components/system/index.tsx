import Banner from '@/components/banner';
import { lazy } from 'solid-js';

const Content = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return import('@/components/system/content');
});

function System() {
  return (
    <div class="relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3">
      <Banner title={'PANEL'} name={'SYSTEM'} />
      <Content />
    </div>
  );
}

export default System;
