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
import { Fragment } from 'react';

interface IFileSectionProps {
  open: VoidFunction;
  fileSystem?: IFileSystem;
}

function FileSection({ open, fileSystem }: IFileSectionProps) {
  const { data: hidden } = useGetShowHiddenFileStatusQuery();

  async function fileAction(file: IFileInfo) {
    if (file.t === DIRECTORY) {
      await writeToPty(`cd '${file.path}'\n`);
    } else if (file.t === FILE) {
      await openFile(file.path);
    }
  }

  return (
    <Fragment>
      <FileTile name={'Setting'} t={SETTING} hidden={false} onClick={open} />
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
export default FileSection;
