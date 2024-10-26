import ActiveProcessTable from '@/components/dashboard/table';

interface ISettingProps {
  open: () => boolean;
  close: VoidFunction;
}

function ActiveProcess(props: ISettingProps) {
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
          class="panel augment-border relative flex size-full animate-fade items-center justify-center overflow-hidden text-center font-united_sans_light text-main shadow-xl transition-all duration-300 ease-in"
          data-augmented-ui="tr-clip bl-clip both"
        >
          <div class="size-full overflow-hidden bg-main text-left transition-all sm:p-1 md:p-3 lg:p-5 xl:p-7">
            <h3 class="font-semibold uppercase sm:text-xl md:text-3xl lg:text-5xl xl:text-7xl">
              Active Processes
            </h3>
            <div class="mt-2 size-full">
              <ActiveProcessTable />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default ActiveProcess;
