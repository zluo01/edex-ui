import Banner from '@/components/banner';
import { IFileSystem } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import isEqual from 'lodash/isEqual';
import { Fragment, lazy, Suspense, useEffect, useState } from 'react';

const FileSection = lazy(() => import('@/components/filesystem/file'));
const Setting = lazy(() => import('@/components/setting'));

function FileSystem() {
  const [open, setOpen] = useState(false);

  const [fileSystem, setFileSystem] = useState<IFileSystem>();

  useEffect(() => {
    const unListen = listen('files', (e: Event<IFileSystem>) => {
      setFileSystem(prevState =>
        isEqual(prevState, e.payload) ? prevState : e.payload,
      );
    });

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, [fileSystem]);

  function openSetting() {
    setOpen(true);
  }

  return (
    <Fragment>
      <div className="relative flex h-full max-h-[38vh] w-full flex-col justify-between sm:p-1 md:p-2 lg:p-3">
        <Banner title={'FILESYSTEM'} name={fileSystem?.path || ''} />
        <div className="no-scrollbar relative box-border grid h-full max-h-[34vh] min-h-[25.5vh] animate-fade appearance-none auto-rows-[8.5vh] grid-cols-[repeat(auto-fill,_minmax(8.5vh,_1fr))] gap-[1vh] overflow-auto">
          <Suspense>
            <FileSection open={openSetting} fileSystem={fileSystem} />
          </Suspense>
        </div>
      </div>
      <Suspense>
        <Setting open={open} close={() => setOpen(false)} />
      </Suspense>
    </Fragment>
  );
}

export default FileSystem;
