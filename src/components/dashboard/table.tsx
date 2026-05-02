import {
	type ColumnDef,
	createSolidTable,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
} from '@tanstack/solid-table';
import { createSignal, For, type JSX } from 'solid-js';
import { useSystemData } from '@/lib/system';
import type { ProcessInformation } from '@/models';

const columns: ColumnDef<ProcessInformation>[] = [
	{ accessorKey: 'pid', header: 'PID' },
	{ accessorKey: 'name', header: 'Name' },
	{
		accessorKey: 'cpu_usage',
		header: 'CPU',
		cell: info => `${info.getValue<number>()}%`,
	},
	{
		accessorKey: 'memory_usage',
		header: 'Memory',
		cell: info => `${info.getValue<number>()}%`,
	},
	{ accessorKey: 'state', header: 'State' },
	{ accessorKey: 'start_time', header: 'Started' },
	{ accessorKey: 'run_time', header: 'Runtime' },
];

const SORT_INDICATOR = { asc: '\u25B2', desc: '\u25BC' } as const;

function ActiveProcessTable(): JSX.Element {
	const systemData = useSystemData();

	const processes = () => systemData()?.processes;

	const [sorting, setSorting] = createSignal<SortingState>([
		{ id: 'cpu_usage', desc: true },
	]);

	const table = createSolidTable({
		get data() {
			return processes() || [];
		},
		columns,
		state: {
			get sorting() {
				return sorting();
			},
		},
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div class="flex h-[90%] w-full flex-col">
			<div
				class={
					'bg-secondary grid grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-default/75 border-[0.1vh] border-solid'
				}
			>
				<For each={table.getHeaderGroups()}>
					{headerGroup => (
						<For each={headerGroup.headers}>
							{header => (
								<button
									type="button"
									class={
										'flex cursor-pointer select-none items-center justify-between hover:opacity-100 border-default/75 sm:text-xxs border-r-[0.1vh] border-solid px-1 text-left font-bold opacity-60 md:text-sm lg:text-lg xl:text-2xl'
									}
									onClick={header.column.getToggleSortingHandler()}
								>
									<span class="truncate">
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</span>
									<span
										class="ml-2 shrink-0 text-[0.6em] leading-none"
										aria-hidden="true"
									>
										{SORT_INDICATOR[
											header.column.getIsSorted() as 'asc' | 'desc'
										] ?? ''}
									</span>
								</button>
							)}
						</For>
					)}
				</For>
			</div>
			<div class="no-scrollbar w-full flex-1 appearance-none overflow-auto">
				<For each={table.getRowModel().rows}>
					{row => (
						<div
							class={
								'grid grid-cols-[10%_27%_8%_10%_12%_21%_12%] items-center border-default/75 border-[0.1vh] border-solid'
							}
						>
							<For each={row.getVisibleCells()}>
								{cell => (
									<span
										class={
											'border-default/75 truncate border-r-[0.1vh] border-solid pl-1 sm:text-xs md:text-base lg:text-xl xl:text-3xl'
										}
										title={
											cell.column.id === 'name'
												? String(cell.getValue() ?? '')
												: undefined
										}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</span>
								)}
							</For>
						</div>
					)}
				</For>
			</div>
		</div>
	);
}

export default ActiveProcessTable;
