import { errorLog } from '@/lib/log';
import { useCurrentTheme } from '@/lib/themes';
import { INetworkTraffic } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import clsx from 'clsx';
import prettyBytes from 'pretty-bytes';
import { SmoothieChart, TimeSeries } from 'smoothie';
import {
  Component,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from 'solid-js';

type NetworkTrafficProps = {
  connected: () => boolean;
};

const NetworkTraffic: Component<NetworkTrafficProps> = ({ connected }) => {
  const theme = useCurrentTheme();

  const canvas: HTMLCanvasElement[] = [
    document.createElement('canvas'),
    document.createElement('canvas'),
  ];

  const [traffic, setTraffic] = createSignal<INetworkTraffic>();

  const unListen = listen('network', (e: Event<INetworkTraffic>) =>
    setTraffic(e.payload),
  );

  const charts: SmoothieChart[] = Array.from(
    { length: 2 },
    (_, i) =>
      new SmoothieChart({
        limitFPS: 40,
        responsive: true,
        millisPerPixel: 70,
        interpolation: 'linear',
        grid: {
          millisPerLine: 5000,
          fillStyle: 'transparent',
          strokeStyle: theme().colors.main,
          verticalSections: 3,
          borderVisible: false,
        },
        labels: {
          fontSize: 10,
          fillStyle: theme().colors.main,
          precision: 2,
        },
        minValue: i === 0 ? 0 : undefined,
        maxValue: i === 1 ? 0 : undefined,
      }),
  );

  const timeSeriesOptions = {
    lineWidth: 1.7,
    strokeStyle: `#aacfd1`,
  };

  const series: TimeSeries[] = [new TimeSeries(), new TimeSeries()];

  charts.forEach((v, i) => v.addTimeSeries(series[i], timeSeriesOptions));

  onMount(() => {
    charts.forEach((v, i) => v.streamTo(canvas[i], 1000));
  });

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
    charts.forEach(o => o.stop());
  });

  createEffect(
    on(traffic, traffic => {
      if (!traffic || !connected()) {
        return;
      }

      const timestamp = new Date().getTime();
      series[0].append(timestamp, traffic.transmitted / 1024);
      series[1].append(timestamp, -traffic.receive / 1024);
    }),
  );

  return (
    <div class="flex w-full flex-col items-start justify-around pb-1 font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <span class="sm:text-xxs md:text-sm lg:text-lg xl:text-3xl">
          NETWORK TRAFFIC
        </span>
        <span class="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
          {`UP ${prettyBytes(traffic()?.transmitted || 0)} / DOWN ${prettyBytes(
            traffic()?.receive || 0,
          )}`}
        </span>
      </div>
      <div class="flex w-full flex-row flex-nowrap items-center justify-between opacity-30">
        <span class="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
          TOTAL
        </span>
        <span class="sm:text-xxs md:text-sm lg:text-lg xl:text-3xl">
          {`${prettyBytes(traffic()?.totalTransmitted || 0)} OUT, ${prettyBytes(
            traffic()?.totalReceive || 0,
          )} IN`}
        </span>
      </div>
      <div class="flex w-full flex-col items-center justify-center">
        <canvas
          ref={el => (canvas[0] = el)}
          class={clsx(
            theme().borderColor['30'],
            connected() ? 'opacity-100' : 'opacity-30',
            'z-10 mx-0 my-[0.46vh] max-h-[10vh] min-h-[8vh] w-full',
            'border-t-[0.092vh] border-dashed',
          )}
        />
        <canvas
          ref={el => (canvas[1] = el)}
          class={clsx(
            connected() ? 'opacity-100' : 'opacity-30',
            theme().borderColor.top,
            theme().borderColor.bottom,
            'z-10 mx-0 max-h-[10vh] min-h-[8vh] w-full',
            'border-b-[0.092vh] border-t-[0.139vh] border-solid',
          )}
        />
        <span
          class={clsx(
            connected() && 'hidden',
            'absolute z-20 m-auto font-semibold sm:text-lg md:text-xl lg:text-2xl xl:text-3xl',
          )}
        >
          OFFLINE
        </span>
      </div>
    </div>
  );
};

export default NetworkTraffic;
