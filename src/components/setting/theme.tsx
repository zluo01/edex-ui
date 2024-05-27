import { useTheme } from '@/themes';
import THEME_LIST from '@/themes/styles';
import clsx from 'clsx';
import findIndex from 'lodash/findIndex';
import { Index } from 'solid-js';

function ChangeThemeSelection() {
  const { theme, updateTheme } = useTheme();

  async function onChangeTheme(index: string) {
    if (updateTheme) {
      await updateTheme(parseInt(index));
    }
  }

  const currentSelect = () => findIndex(THEME_LIST, theme());

  return (
    <div class="flex flex-row flex-nowrap items-center justify-between py-1">
      <span
        class={clsx(
          theme().textColor.main,
          'sm:text-base md:text-xl lg:text-3xl xl:text-5xl',
        )}
      >
        Change Theme
      </span>
      <select
        class={clsx(
          theme().textColor.main,
          theme().borderColor.default,
          theme().backgroundColor.secondary,
          'relative block w-32 cursor-pointer border-2 border-solid px-2 text-center focus:outline-none',
          'appearance-none sm:text-sm md:text-lg lg:text-2xl xl:text-3xl',
        )}
        value={currentSelect()}
        onInput={e => onChangeTheme(e.currentTarget.value)}
      >
        <Index each={THEME_LIST}>
          {(t, i) => (
            <option
              value={i}
              class={clsx(
                theme().textColor.main,
                theme().backgroundColor.secondary,
                'mt-1 max-h-60 w-full overflow-auto focus:outline-none sm:text-sm md:text-base lg:text-xl xl:text-2xl',
              )}
            >
              {t().name.toUpperCase()}
            </option>
          )}
        </Index>
      </select>
    </div>
  );
}

export default ChangeThemeSelection;
