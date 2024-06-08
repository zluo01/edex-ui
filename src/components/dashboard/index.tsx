import ActiveProcessTable from '@/components/dashboard/table';
import { useCurrentTheme } from '@/lib/themes';
import clsx from 'clsx';

interface ISettingProps {
  open: () => boolean;
  close: VoidFunction;
}

function ActiveProcess({ open, close }: ISettingProps) {
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
            theme().textColor.main,
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
            <h3 class="font-semibold uppercase sm:text-xl md:text-3xl lg:text-5xl xl:text-7xl">
              Active Processes
            </h3>
            <div class="mt-2 size-full">
              <ActiveProcessTable theme={theme} />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default ActiveProcess;
