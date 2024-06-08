import { useCurrentTheme } from '@/lib/themes';
import { ICPUData } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';

function CpuInfo() {
  const theme = useCurrentTheme();

  const canvas: HTMLCanvasElement[] = [
    document.createElement('canvas'),
    document.createElement('canvas'),
  ];

  const [data, setData] = createSignal<ICPUData>();

  const unListen = listen('load', (e: Event<ICPUData>) => setData(e.payload));

  const cpuName = () => {
    if (!data()) {
      return '';
    }
    const cpuName = data()!.name.split('CPU')[0];
    return cpuName
      .replace(/\(R\)/g, '®')
      .replace(/\(TM\)/g, '™')
      .trim();
  };

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

  const series: TimeSeries[] = [];

  const timeSeriesOptions = {
    lineWidth: 1.7,
    strokeStyle: `#aacfd1`,
  };

  onMount(() => {
    charts.forEach((v, i) => v.streamTo(canvas[i], 1000));
  });

  onCleanup(() => {
    unListen.then(f => f()).catch(e => console.error(e));
    charts.forEach(o => o.stop());
  });

  createEffect(
    on(data, data => {
      if (!data) {
        return;
      }
      if (!series.length) {
        series.push(
          ...Array.from({ length: data.cores }, (_, i) => {
            const timeSeries = new TimeSeries();

            if (i < data.divide) {
              charts[0].addTimeSeries(timeSeries, timeSeriesOptions);
            } else {
              charts[1].addTimeSeries(timeSeries, timeSeriesOptions);
            }

            return timeSeries;
          }),
        );
      }
      const timestamp = new Date().getTime();
      data.usage.forEach((v, i) => series[i].append(timestamp, v));
    }),
  );

  return (
    <div class="flex w-full flex-col items-center justify-between space-y-1 font-united_sans_light tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <span class="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
          CPU USAGE
        </span>
        <span class="opacity-50 sm:text-xxs md:text-sm lg:text-xl xl:text-2xl">
          {cpuName()}
        </span>
      </div>
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <div class="flex flex-col items-start justify-around">
          <span class="font-united_sans_medium font-semibold not-italic sm:text-xxs md:text-sm lg:text-lg xl:text-xl">
            # {1} - {data()?.divide}
          </span>
          <span class="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-lg">
            Avg. {data()?.load[0]?.toFixed(1) || '--'}%
          </span>
        </div>
        <canvas
          ref={el => (canvas[0] = el)}
          height="60"
          class={clsx(
            theme().borderColor['30'],
            'my-[0.46vh] h-[4.167vh] w-[76%] border-y-[0.092vh] border-dashed',
          )}
        />
      </div>
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <div class="flex flex-col items-start justify-around">
          <span class="font-united_sans_medium font-semibold not-italic sm:text-xxs md:text-sm lg:text-lg xl:text-xl">
            # {data()?.divide && data()!.divide + 1} - {data()?.cores}
          </span>
          <span class="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-lg">
            Avg. {data()?.load[1]?.toFixed(1) || '--'}%
          </span>
        </div>
        <canvas
          ref={el => (canvas[1] = el)}
          height="60"
          class={clsx(
            theme().borderColor['30'],
            'my-[0.46vh] h-[4.167vh] w-[76%] border-y-[0.092vh] border-dashed',
          )}
        />
      </div>
      <div
        class={clsx(
          theme().borderColor['30'],
          'h-0 w-[95%] border-t-2 border-dashed',
        )}
      />
      <div class="flex w-full flex-row items-center justify-around py-2">
        <div class="flex flex-col">
          <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">CPU</span>
          <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
            {data()?.temperature.cpu.toFixed(1) || '--'}°C
          </span>
        </div>
        <div class="flex flex-col">
          <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">GPU</span>
          <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
            {data()?.temperature.gpu.toFixed(1) || '--'}°C
          </span>
        </div>
        <div class="flex flex-col">
          <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
            BATTERY
          </span>
          <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
            {data()?.temperature.battery.toFixed(1) || '--'}°C
          </span>
        </div>
      </div>
    </div>
  );
}

export default CpuInfo;
