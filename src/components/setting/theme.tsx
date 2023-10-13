import { setTheme } from '@/lib/setting';
import classNames from '@/lib/utils/style';
import { IStyle } from '@/models';
import ThemeContext from '@/themes/provider';
import THEME_LIST from '@/themes/styles';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment, useContext } from 'react';
import { useSWRConfig } from 'swr';

function ChangeThemeSelection() {
  const theme = useContext(ThemeContext);
  const { mutate } = useSWRConfig();

  async function onChangeTheme(value: IStyle) {
    await setTheme(value);
    await mutate('THEME');
  }

  function activeStyles(active: boolean): string {
    const styles = [
      'relative cursor-pointer select-none py-2 text-center border-b-2 border-solid',
      theme.borderColor.bottom,
    ];
    if (active) {
      styles.push(theme.textColor.active, theme.backgroundColor.active);
    }
    return classNames(...styles);
  }

  return (
    <div className="flex flex-row flex-nowrap items-center justify-between py-1">
      <span
        className={classNames(
          theme.textColor.main,
          'sm:text-base md:text-xl lg:text-3xl xl:text-5xl',
        )}
      >
        Change Theme
      </span>
      <Listbox value={theme} onChange={onChangeTheme}>
        <div className="relative">
          <Listbox.Button
            className={classNames(
              theme.textColor.main,
              theme.borderColor.default,
              'relative w-32 cursor-pointer text-center border-2 border-solid focus:outline-none',
              'sm:text-sm md:text-lg lg:text-2xl xl:text-3xl',
            )}
          >
            <span className="truncate">{theme.name.toUpperCase()}</span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={classNames(
                theme.textColor.main,
                theme.backgroundColor.secondary,
                'absolute mt-1 max-h-60 w-full overflow-auto focus:outline-none sm:text-sm md:text-base lg:text-xl xl:text-2xl',
              )}
            >
              {THEME_LIST.map((t, i) => (
                <Listbox.Option
                  key={i}
                  className={({ active }) => activeStyles(active)}
                  value={t}
                >
                  {({ selected }) => (
                    <span
                      className={classNames(
                        selected ? 'font-medium' : 'font-normal',
                        'block truncate',
                      )}
                    >
                      {t.name.toUpperCase()}
                    </span>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

export default ChangeThemeSelection;
