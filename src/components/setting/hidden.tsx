import { useGetShowHiddenFileStatusQuery } from '@/lib/queries';
import { setShowHiddenFileStatus } from '@/lib/setting';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { Switch } from '@headlessui/react';
import { useContext } from 'react';

function ShowHiddenFileSetting() {
  const theme = useContext(ThemeContext);

  const { data: showHidden, mutate } = useGetShowHiddenFileStatusQuery();

  async function change() {
    await setShowHiddenFileStatus(!showHidden);
    await mutate();
  }

  return (
    <div className="flex flex-row flex-nowrap items-center justify-between py-1">
      <span
        className={classNames(
          theme.textColor.main,
          'sm:text-base md:text-xl lg:text-3xl xl:text-5xl',
        )}
      >
        Show Hidden File
      </span>
      <Switch
        disabled={showHidden === undefined}
        checked={showHidden}
        onChange={change}
        className={classNames(
          showHidden
            ? theme.backgroundColor.secondary
            : theme.backgroundColor.main,
          theme.borderColor.default,
          'relative inline-flex h-[28px] w-[54px] shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none',
        )}
      >
        <div className={showHidden ? 'grow' : 'grow-0'} />
        <span
          aria-hidden="true"
          className={classNames(
            theme.backgroundColor.active,
            'pointer-events-none inline-block h-[24px] w-[24px] ring-0 transition duration-200 ease-in-out',
          )}
        />
      </Switch>
    </div>
  );
}

export default ShowHiddenFileSetting;
