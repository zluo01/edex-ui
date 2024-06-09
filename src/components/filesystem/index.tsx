import Banner from '@/components/banner';
import { errorLog } from '@/lib/log';
import {
  getShowHiddenFileStatus,
  setShowHiddenFileStatus,
} from '@/lib/setting';
import { IFileSystem } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { createResource, createSignal, lazy, onCleanup } from 'solid-js';

const FileSection = lazy(async () => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return import('@/components/filesystem/file');
});

const Setting = lazy(() => import('@/components/setting'));

function FileSystem() {
  const [open, setOpen] = createSignal(false);
  const [showHidden, { mutate }] = createResource(getShowHiddenFileStatus);

  async function change() {
    const v = !showHidden();
    await setShowHiddenFileStatus(v);
    mutate(v);
  }

  const [fileSystem, setFileSystem] = createSignal<IFileSystem>();

  const unListen = listen('files', (e: Event<IFileSystem>) =>
    setFileSystem(e.payload),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
  });

  return (
    <>
      <div class="relative flex size-full max-h-[38vh] flex-col justify-between sm:p-1 md:p-2 lg:p-3">
        <Banner title={'FILESYSTEM'} name={fileSystem()?.path || ''} />
        <div
          class={clsx(
            'no-scrollbar relative box-border grid h-full max-h-[34vh] min-h-[25.5vh]',
            'animate-fade appearance-none auto-rows-[8.5vh] grid-cols-[repeat(auto-fill,_minmax(8.5vh,_1fr))] gap-[1vh] overflow-auto',
          )}
        >
          <FileSection
            open={() => setOpen(true)}
            showHidden={showHidden}
            fileSystem={fileSystem}
          />
        </div>
      </div>
      <Setting
        open={open}
        close={() => setOpen(false)}
        showHidden={showHidden}
        changeHidden={change}
      />
    </>
  );
}

export default FileSystem;
