import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { ForwardedRef, forwardRef, useContext } from 'react';

interface ICpuUsage {
  from?: number;
  to?: number;
  load?: number;
}

function CpuUsage(
  { from, to, load }: ICpuUsage,
  ref: ForwardedRef<HTMLCanvasElement>,
) {
  const theme = useContext(ThemeContext);

  return (
    <div className="flex w-full flex-row flex-nowrap items-center justify-between">
      <div className="flex flex-col items-start justify-around">
        <span className="font-united_sans_medium font-semibold not-italic sm:text-xxs md:text-sm lg:text-xl xl:text-2xl">
          # {from} - {to}
        </span>
        <span className="opacity-50 sm:text-xxxs md:text-xs lg:text-base xl:text-lg">
          Avg. {load?.toFixed(1) || '--'}%
        </span>
      </div>
      <canvas
        ref={ref}
        height="60"
        className={classNames(
          theme.borderColor['30'],
          'my-[0.46vh] h-[4.167vh] w-[76%] border-y-[0.092vh] border-dashed',
        )}
      />
    </div>
  );
}

export default forwardRef<HTMLCanvasElement, ICpuUsage>(CpuUsage);
