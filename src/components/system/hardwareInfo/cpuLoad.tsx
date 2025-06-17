import { errorLog } from '@/lib/log';
import { selectStyle, useTheme } from '@/lib/themes';
import { ICPUData, SystemData } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';

function CpuLoad() {
  const { theme } = useTheme();
  const style = () => selectStyle(theme());

  const canvas: HTMLCanvasElement[] = [
    document.createElement('canvas'),
    document.createElement('canvas'),
  ];

  const [data, setData] = createSignal<ICPUData>();

  const unListen = listen('system', (e: Event<SystemData>) =>
    setData(e.payload.cpu),
  );

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
        <span class="sm:text-xxs opacity-50 md:text-sm lg:text-xl xl:text-2xl">
          {/*@once*/ cpuName()}
        </span>
      </div>
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <div class="flex flex-col items-start justify-around">
          <span class="font-united_sans_medium sm:text-xxs font-semibold not-italic md:text-sm lg:text-lg xl:text-xl">
            # {1} - {data()?.divide}
          </span>
          <span class="sm:text-xxxs opacity-50 md:text-xs lg:text-base xl:text-lg">
            Avg. {data()?.load[0]?.toFixed(1) || '--'}%
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
          <span class="font-united_sans_medium sm:text-xxs font-semibold not-italic md:text-sm lg:text-lg xl:text-xl">
            # {data()?.divide && data()!.divide + 1} - {data()?.cores}
          </span>
          <span class="sm:text-xxxs opacity-50 md:text-xs lg:text-base xl:text-lg">
            Avg. {data()?.load[1]?.toFixed(1) || '--'}%
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

export default CpuLoad;
