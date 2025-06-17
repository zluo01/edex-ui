import { useTheme } from '@/lib/themes';
import { Theme } from '@/lib/themes/styles';
import { For } from 'solid-js';

function ChangeThemeSelection() {
  const { theme, updateTheme } = useTheme();

  async function onChangeTheme(t: Theme) {
    if (updateTheme) {
      await updateTheme(t);
    }
  }

  return (
    <div class="flex flex-row flex-nowrap items-center justify-between py-1">
      <span class="text-main sm:text-base md:text-xl lg:text-3xl xl:text-5xl">
        Change Theme
      </span>
      <select
        class="border-default bg-secondary text-main relative block w-32 cursor-pointer appearance-none border-2 border-solid px-2 text-center focus:outline-hidden sm:text-sm md:text-lg lg:text-2xl xl:text-3xl"
        value={theme()}
        onInput={e => onChangeTheme(e.currentTarget.value as Theme)}
      >
        <For each={Object.values(Theme)}>
          {t => (
            <option
              value={t}
              class="bg-secondary text-main mt-1 max-h-60 w-full overflow-auto focus:outline-hidden sm:text-sm md:text-base lg:text-xl xl:text-2xl"
            >
              {t}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}

export default ChangeThemeSelection;
