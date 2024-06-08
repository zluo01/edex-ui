import FileTile from '@/components/filesystem/tile';
import { openFile, writeToPty } from '@/lib/os';
import { useActiveTerminal } from '@/lib/terminal';
import {
  BACKWARD,
  DIRECTORY,
  FILE,
  IFileInfo,
  IFileSystem,
  SETTING,
} from '@/models';
import { For, Resource } from 'solid-js';

interface IFileSectionProps {
  open: VoidFunction;
  showHidden: Resource<boolean>;
  fileSystem: () => IFileSystem | undefined;
}

function FileSection({ open, showHidden, fileSystem }: IFileSectionProps) {
  const active = useActiveTerminal();

  async function fileAction(file: IFileInfo) {
    if (file.t === DIRECTORY) {
      await writeToPty(active(), `cd '${file.path}'\n`);
    } else if (file.t === FILE) {
      await openFile(file.path);
    }
  }

  return (
    <>
      <FileTile name={'Setting'} t={SETTING} hidden={false} onClick={open} />
      <FileTile
        name={'Go back'}
        t={BACKWARD}
        hidden={false}
        onClick={() => writeToPty(active(), 'cd ../\n')}
      />
      <For each={fileSystem()?.files.filter(o => !o.hidden || showHidden())}>
        {file => <FileTile {...file} onClick={() => fileAction(file)} />}
      </For>
    </>
  );
}

export default FileSection;
