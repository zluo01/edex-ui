import Icon from '@/components/filesystem/icon';
import { FileType } from '@/models';

interface IFileTileProps {
  name: string;
  t: FileType;
  hidden: boolean;
  onClick?: VoidFunction;
}

function FileTile(props: IFileTileProps) {
  return (
    <div
      className="flex h-[8.5vh] w-[8.5vh] cursor-pointer flex-col items-center justify-center overflow-hidden rounded text-center hover:opacity-70"
      onClick={props.onClick}
      title={props.name}
    >
      <Icon {...props} />
      <span className="w-full truncate sm:text-xxs md:text-xs lg:text-sm xl:text-lg">
        {props.name}
      </span>
    </div>
  );
}

export default FileTile;
