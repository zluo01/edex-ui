import { useCurrentTheme } from '@/themes';
import clsx from 'clsx';
import { Resource } from 'solid-js';

interface IShowHiddenFileSettingProps {
  showHidden: Resource<boolean>;
  changeHidden: () => void;
}

function ShowHiddenFileSetting({
  showHidden,
  changeHidden,
}: IShowHiddenFileSettingProps) {
  const theme = useCurrentTheme();

  return (
    <div class="flex flex-row flex-nowrap items-center justify-between py-1">
      <span
        class={clsx(
          theme().textColor.main,
          'sm:text-base md:text-xl lg:text-3xl xl:text-5xl',
        )}
      >
        Show Hidden File
      </span>

      <label class="inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          class="peer sr-only"
          disabled={showHidden() === undefined}
          checked={showHidden()}
          onChange={changeHidden}
        />
        <div
          class={clsx(
            theme().backgroundColor.secondary,
            'peer relative h-6 w-11 rounded-full',
            'after:absolute after:start-[2px] after:top-[2px] after:size-5 after:rounded-full',
            "after:border after:border-gray-300 after:bg-white after:transition-all after:content-['']",
            'peer-checked:opacity-75 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none',
          )}
        ></div>
      </label>
    </div>
  );
}

export default ShowHiddenFileSetting;
