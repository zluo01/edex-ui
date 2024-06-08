import ShowHiddenFileSetting from '@/components/setting/hidden';
import ChangeThemeSelection from '@/components/setting/theme';
import { useCurrentTheme } from '@/themes';
import clsx from 'clsx';
import { Resource } from 'solid-js';

interface ISettingProps {
  open: () => boolean;
  showHidden: Resource<boolean>;
  changeHidden: () => void;
  close: VoidFunction;
}

export default function Setting({
  open,
  close,
  showHidden,
  changeHidden,
}: ISettingProps) {
  const theme = useCurrentTheme();

  return (
    <dialog
      class="relative z-10"
      aria-labelledby="modal-title"
      aria-modal="true"
      open={open()}
      onClick={e => {
        if (e.target.id === 'background') {
          close();
        }
      }}
    >
      <div
        id="background"
        class="fixed inset-0 bg-black/25 transition-opacity"
      />

      <div class="fixed inset-0 z-20 m-auto h-fit max-h-[62vh] min-h-[62vh] w-[38vw] overflow-y-auto">
        <div
          class={clsx(
            theme().name,
            'panel flex size-full items-center justify-center text-center font-united_sans_light',
            'relative animate-fade overflow-hidden shadow-xl transition-all duration-300 ease-in',
          )}
          data-augmented-ui="tr-clip bl-clip both"
        >
          <div
            class={clsx(
              theme().backgroundColor.main,
              'size-full overflow-hidden text-left transition-all sm:p-1 md:p-3 lg:p-5 xl:p-7',
            )}
          >
            <h3
              class={clsx(
                theme().textColor.main,
                'font-semibold uppercase sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl',
              )}
            >
              Settings
            </h3>
            <div class="mt-2 flex flex-col">
              <ShowHiddenFileSetting
                showHidden={showHidden}
                changeHidden={changeHidden}
              />
              <ChangeThemeSelection />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
