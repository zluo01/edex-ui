import Banner from '@/components/banner';
import FileTile from '@/components/filesystem/tile';
import { openFile, writeToPty } from '@/lib/os';
import { useGetShowHiddenFileStatusQuery } from '@/lib/queries';
import {
  BACKWARD,
  DIRECTORY,
  FILE,
  IFileInfo,
  IFileSystem,
  SETTING,
} from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import isEqual from 'lodash/isEqual';
import { Fragment, lazy, Suspense, useEffect, useState } from 'react';

const Setting = lazy(() => import('@/components/setting'));

function FileSystem() {
  const { data: hidden } = useGetShowHiddenFileStatusQuery();

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

  async function fileAction(file: IFileInfo) {
    if (file.t === DIRECTORY) {
      await writeToPty(`cd '${file.path}'\n`);
    } else if (file.t === FILE) {
      await openFile(file.path);
    }
  }

  function FileSection() {
    return (
      <Fragment>
        <FileTile
          name={'Setting'}
          t={SETTING}
          hidden={false}
          onClick={() => setOpen(true)}
        />
        <FileTile
          name={'Go back'}
          t={BACKWARD}
          hidden={false}
          onClick={() => writeToPty('cd ../\n')}
        />
        {fileSystem?.files
          .filter(o => !o.hidden || hidden)
          .map((file, i) => (
            <FileTile key={i} {...file} onClick={() => fileAction(file)} />
          ))}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <div className="relative flex h-full max-h-[38vh] w-full flex-col justify-between sm:p-1 md:p-2 lg:p-3">
        <Banner title={'FILESYSTEM'} name={fileSystem?.path || ''} />
        <div className="no-scrollbar relative box-border grid h-full max-h-[34vh] min-h-[25.5vh] appearance-none auto-rows-[8.5vh] grid-cols-[repeat(auto-fill,_minmax(8.5vh,_1fr))] gap-[1vh] overflow-auto">
          <FileSection />
        </div>
      </div>
      <Suspense>
        <Setting open={open} close={() => setOpen(false)} />
      </Suspense>
    </Fragment>
  );
}

export default FileSystem;
