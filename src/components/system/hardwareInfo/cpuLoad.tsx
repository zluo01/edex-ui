import { errorLog } from '@/lib/log';
import { ICPUData, IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import { SmoothieChart, TimeSeries } from 'smoothie';
import {
  createEffect,
  createSignal,
  InitializedResource,
  on,
  onCleanup,
  onMount,
} from 'solid-js';

interface ICpuLoadProps {
  theme: InitializedResource<IStyle>;
}

function CpuLoad({ theme }: ICpuLoadProps) {
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
    unListen.then(f => f()).catch(errorLog);
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
    <>
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
            'my-[0.46vh] h-[4.167vh] w-[70%] border-y-[0.092vh] border-dashed',
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
            'my-[0.46vh] h-[4.167vh] w-[70%] border-y-[0.092vh] border-dashed',
          )}
        />
      </div>
    </>
  );
}

export default CpuLoad;
