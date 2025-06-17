import Icon from '@/components/filesystem/icon';
import { FileType } from '@/models';

interface IFileTileProps {
  name: string;
  t: FileType;
  hidden: boolean;
  onClick: VoidFunction;
}

function FileTile(props: IFileTileProps) {
  return (
    <div
      class="flex size-[8.5vh] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-sm text-center hover:opacity-70"
      onMouseDown={() => props.onClick()}
      title={props.name}
    >
      <Icon {...props} />
      <span class="sm:text-xxs w-full truncate md:text-xs lg:text-sm xl:text-lg">
        {props.name}
      </span>
    </div>
  );
}

export default FileTile;
