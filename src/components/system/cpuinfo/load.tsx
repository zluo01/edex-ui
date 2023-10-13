import CpuUsage from '@/components/system/cpuinfo/usage';
import { createRef, Fragment, useEffect, useMemo } from 'react';
import { TimeSeries, SmoothieChart } from 'smoothie';

interface ICpuLoadProps {
  cores?: number;
  divide?: number;
  load?: number[];
  usage?: number[];
}

function CpuLoad({ cores, divide, load, usage }: ICpuLoadProps) {
  const chartRef = useMemo(
    () => [createRef<HTMLCanvasElement>(), createRef<HTMLCanvasElement>()],
    [],
  );

  const charts: SmoothieChart[] = useMemo(
    () =>
      Array.from(
        { length: 2 },
        _ =>
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
      ),
    [],
  );

  const series: TimeSeries[] = useMemo(() => {
    if (!cores || !divide) {
      return [];
    }
    return Array.from({ length: cores }, (_, i) => {
      const timeSeries = new TimeSeries();

      const options = {
        lineWidth: 1.7,
        strokeStyle: `#aacfd1`,
      };

      if (i < divide) {
        charts[0].addTimeSeries(timeSeries, options);
      } else {
        charts[1].addTimeSeries(timeSeries, options);
      }

      return timeSeries;
    });
  }, [charts, cores, divide]); // An array of dependencies

  useEffect(() => {
    charts.forEach((o, i) =>
      o.streamTo(chartRef[i].current as HTMLCanvasElement, 1000),
    );

    return () => {
      charts.forEach(o => o.stop());
    };
  }, [chartRef, charts]);

  useEffect(() => {
    if (!usage) {
      return;
    }
    const timestamp = new Date().getTime();
    usage.forEach((v, i) => series[i].append(timestamp, v));
  }, [series, usage]);

  return (
    <Fragment>
      <CpuUsage ref={chartRef[0]} from={1} to={divide} load={load?.[0]} />
      <CpuUsage
        ref={chartRef[1]}
        from={divide && divide + 1}
        to={cores}
        load={load?.[1]}
      />
    </Fragment>
  );
}

export default CpuLoad;
