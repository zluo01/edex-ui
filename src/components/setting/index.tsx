import ShowHiddenFileSetting from '@/components/setting/hidden';
import ChangeThemeSelection from '@/components/setting/theme';
import { Resource } from 'solid-js';

interface ISettingProps {
  open: () => boolean;
  showHidden: Resource<boolean>;
  changeHidden: () => void;
  close: VoidFunction;
}

export default function Setting(props: ISettingProps) {
  return (
    <dialog
      class="relative z-10"
      aria-labelledby="modal-title"
      aria-modal="true"
      open={props.open()}
      onMouseDown={e => {
        if (e.target.id === 'background') {
          props.close();
        }
      }}
    >
      <div
        id="background"
        class="bg-black/25 fixed inset-0 transition-opacity"
      />
      <div class="fixed inset-0 z-20 m-auto h-fit max-h-[62vh] min-h-[62vh] w-[38vw] overflow-y-auto">
        <div
          class="panel augment-border relative flex size-full animate-fade items-center justify-center overflow-hidden text-center font-united_sans_light shadow-xl transition-all duration-300 ease-in"
          data-augmented-ui="tr-clip bl-clip both"
        >
          <div class="size-full overflow-hidden bg-main text-left transition-all sm:p-1 md:p-3 lg:p-5 xl:p-7">
            <h3 class="font-semibold uppercase text-main sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl">
              Settings
            </h3>
            <div class="my-2 flex flex-col">
              <ShowHiddenFileSetting
                showHidden={props.showHidden}
                changeHidden={props.changeHidden}
              />
              <ChangeThemeSelection />
            </div>
            <h3 class="font-semibold uppercase text-main sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl">
              Shortcuts
            </h3>
            <div class="mb-2 flex flex-col gap-2 sm:text-base md:text-xl lg:text-3xl xl:text-5xl">
              <div class="flex flex-row flex-nowrap items-center justify-between text-main">
                <span>Switch Terminal</span>
                <span class="capitalize">Ctrl + tab</span>
              </div>
              <div class="flex flex-row flex-nowrap justify-between text-main">
                <span>Create New Terminal</span>
                <span class="capitalize">Ctrl + w</span>
              </div>
              <div class="flex flex-row flex-nowrap justify-between text-main">
                <span>Close current Terminal</span>
                <span class="capitalize">Ctrl + t</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
