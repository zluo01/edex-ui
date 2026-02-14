import { type Event, listen } from '@tauri-apps/api/event';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import { errorLog } from '@/lib/log';
import { selectStyle, useTheme } from '@/lib/themes';
import type { CPUData, GPUData, SystemData } from '@/models';

interface LoadData {
	cpu: CPUData;
	gpu: GPUData;
}

function Load() {
	const { theme } = useTheme();
	const style = () => selectStyle(theme());

	const canvas: HTMLCanvasElement[] = [
		document.createElement('canvas'),
		document.createElement('canvas'),
	];

	const [data, setData] = createSignal<LoadData>();

	const unListen = listen('system', (e: Event<SystemData>) =>
		setData({
			cpu: e.payload.cpu,
			gpu: e.payload.gpu,
		}),
	);

	const charts: SmoothieChart[] = Array.from(
		{ length: 2 },
		() =>
			new SmoothieChart({
				limitFPS: 30,
				responsive: true,
				millisPerPixel: 50,
				grid: {
					fillStyle: 'transparent',
					strokeStyle: 'transparent',
					verticalSections: 0,
					borderVisible: false,
				},
				labels: {
					disabled: true,
				},
				yRangeFunction: () => ({ min: 0, max: 100 }),
			}),
	);

	const cpuSeries: TimeSeries[] = [];
	const gpuSeries: TimeSeries = new TimeSeries();

	const timeSeriesOptions = {
		strokeStyle: style().colors.main,
	};

	onMount(() => {
		charts.forEach((v, i) => v.streamTo(canvas[i], 1000));
	});

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
		charts.forEach(o => o.stop());
	});

	createEffect(
		on(data, data => {
			if (!data) {
				return;
			}
			if (!cpuSeries.length) {
				cpuSeries.push(
					...Array.from({ length: data.cpu.core }, () => {
						const timeSeries = new TimeSeries();
						charts[0].addTimeSeries(timeSeries, timeSeriesOptions);
						return timeSeries;
					}),
				);

				// gpu timeSeries
				charts[1].addTimeSeries(gpuSeries, timeSeriesOptions);
			}

			const timestamp = Date.now();
			data.cpu.usage.forEach((v, i) => cpuSeries[i].append(timestamp, v));
			gpuSeries.append(timestamp, data.gpu.load);
		}),
	);

	return (
		<>
			<div class="flex w-full flex-row flex-nowrap items-center justify-between">
				<span class="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
					USAGE
				</span>
				<div class="flex flex-col items-end justify-end">
					<span class="text-xxs opacity-50">{data()?.cpu.name}</span>
					<span class="text-xxs opacity-50">{data()?.gpu.name}</span>
				</div>
			</div>
			<div class="flex w-full flex-row flex-nowrap items-center justify-between">
				<div class="flex flex-col items-start justify-around">
					<span class="font-united_sans_medium sm:text-xxxs md:text-xxs font-semibold not-italic lg:text-sm xl:text-lg">
						CPU - {data()?.cpu.temperature.toFixed(1) || '--'}°C
					</span>
					<span class="sm:text-xxxs opacity-50 md:text-xs lg:text-base xl:text-lg">
						Avg. {data()?.cpu.load.toFixed(1) || '--'}%
					</span>
				</div>
				<canvas
					ref={el => (canvas[0] = el)}
					height="60"
					class="border-default/30 my-[0.46vh] h-[4.167vh] w-[70%] border-y-[0.092vh] border-dashed"
				/>
			</div>
			<div class="flex w-full flex-row flex-nowrap items-center justify-between">
				<div class="flex flex-col items-start justify-around">
					<span class="font-united_sans_medium sm:text-xxxs md:text-xxs font-semibold not-italic lg:text-sm xl:text-lg">
						GPU - {data()?.gpu.temperature.toFixed(1) || '--'}°C
					</span>
					<span class="sm:text-xxxs opacity-50 md:text-xs lg:text-base xl:text-lg">
						Avg. {data()?.gpu.load.toFixed(1) || '--'}%
					</span>
				</div>
				<canvas
					ref={el => (canvas[1] = el)}
					height="60"
					class="border-default/30 my-[0.46vh] h-[4.167vh] w-[70%] border-y-[0.092vh] border-dashed"
				/>
			</div>
		</>
	);
}

export default Load;
