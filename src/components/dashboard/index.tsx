import ActiveProcessTable from '@/components/dashboard/table';
import { closeModal } from '@/lib/utils';

function ActiveProcess() {
	return (
		<dialog
			id="active-process-modal"
			class="relative z-10 backdrop:bg-black/25"
			aria-labelledby="modal-title"
			onCancel={() => closeModal('active-process-modal')}
			onMouseDown={e => {
				if (e.target === e.currentTarget) {
					closeModal('active-process-modal');
				}
			}}
		>
			<div class="fixed inset-0 z-20 m-auto h-fit max-h-[62vh] min-h-[62vh] w-[38vw] overflow-y-auto">
				<div
					class="panel augment-border animate-fade font-united_sans_light text-main relative flex size-full items-center justify-center overflow-hidden text-center shadow-xl transition-all duration-300 ease-in"
					data-augmented-ui="tr-clip bl-clip both"
				>
					<div class="bg-main size-full overflow-hidden text-left transition-all sm:p-1 md:p-3 lg:p-5 xl:p-7">
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
