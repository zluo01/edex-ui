import useGetNetworkConnection from '@/lib/utils/network';
import classNames from '@/lib/utils/style';
import { INetworkTraffic } from '@/models';
import ThemeContext from '@/themes/provider';
import { Event, listen } from '@tauri-apps/api/event';
import prettyBytes from 'pretty-bytes';
import { createRef, useContext, useEffect, useMemo, useState } from 'react';
import { SmoothieChart, TimeSeries } from 'smoothie';

function NetworkTraffic() {
  const theme = useContext(ThemeContext);

  const status = useGetNetworkConnection();

  const [traffic, setTraffic] = useState<INetworkTraffic>();

  const chartRef = useMemo(
    () => [createRef<HTMLCanvasElement>(), createRef<HTMLCanvasElement>()],
    [],
  );

  const charts: SmoothieChart[] = useMemo(
    () =>
      Array.from(
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
              strokeStyle: theme.colors.main,
              verticalSections: 3,
              borderVisible: false,
            },
            labels: {
              fontSize: 10,
              fillStyle: theme.colors.main,
              precision: 2,
            },
            minValue: i === 0 ? 0 : undefined,
            maxValue: i === 1 ? 0 : undefined,
          }),
      ),
    [],
  );

  const series: TimeSeries[] = useMemo(() => {
    return Array.from({ length: 2 }, (_, i) => {
      const timeSeries = new TimeSeries();

      const options = {
        lineWidth: 1.7,
        strokeStyle: `#aacfd1`,
      };

      charts[i].addTimeSeries(timeSeries, options);

      return timeSeries;
    });
  }, [charts]);

  useEffect(() => {
    charts.forEach((o, i) =>
      o.streamTo(chartRef[i].current as HTMLCanvasElement, 1000),
    );

    const unListen = listen('network', (e: Event<INetworkTraffic>) =>
      setTraffic(e.payload),
    );

    return () => {
      charts.forEach(o => o.stop());
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, [chartRef, charts]);

  useEffect(() => {
    const timestamp = new Date().getTime();
    if (!traffic || !status) {
      return;
    }

    series[0].append(timestamp, traffic.transmitted / 1024);
    series[1].append(timestamp, -traffic.receive / 1024);
  }, [series, status, traffic]);

  return (
    <div className="flex w-full flex-col items-start justify-around pb-1 font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div className="flex w-full flex-row flex-nowrap items-center justify-between">
        <span className="sm:text-xxs md:text-sm lg:text-lg xl:text-3xl">
          NETWORK TRAFFIC
        </span>
        <span className="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
          {`UP ${prettyBytes(traffic?.transmitted || 0)} / DOWN ${prettyBytes(
            traffic?.receive || 0,
          )}`}
        </span>
      </div>
      <div className="flex w-full flex-row flex-nowrap items-center justify-between opacity-30">
        <span className="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
          TOTAL
        </span>
        <span className="opacity-50 sm:text-xxs md:text-sm lg:text-lg  xl:text-3xl">
          {`${prettyBytes(traffic?.totalTransmitted || 0)} OUT, ${prettyBytes(
            traffic?.totalReceive || 0,
          )} IN`}
        </span>
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        <canvas
          ref={chartRef[0]}
          className={classNames(
            theme.borderColor['30'],
            !status ? 'opacity-30' : 'opacity-100',
            'z-10 my-[0.46vh] mx-0 max-h-[10vh] min-h-[8vh] w-full',
            'border-t-[0.092vh] border-dashed',
          )}
        />
        <canvas
          ref={chartRef[1]}
          className={classNames(
            !status ? 'opacity-30' : 'opacity-100',
            theme.borderColor.top,
            theme.borderColor.bottom,
            'z-10 mx-0 max-h-[10vh] min-h-[8vh] w-full',
            'border-t-[0.139vh] border-solid border-b-[0.092vh]',
          )}
        />
        <span
          className={classNames(
            status ? 'hidden' : '',
            'absolute z-20 m-auto font-semibold sm:text-lg md:text-xl lg:text-2xl xl:text-3xl',
          )}
        >
          OFFLINE
        </span>
      </div>
    </div>
  );
}

export default NetworkTraffic;
