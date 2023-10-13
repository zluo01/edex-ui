import TableRows from '@/components/dashboard/rows';
import classNames from '@/lib/utils/style';
import { IStyle } from '@/models';
import { RefObject, useEffect, useRef, useState } from 'react';

function useContainerHeight(ref: RefObject<HTMLDivElement>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function getHeight() {
      setHeight(ref.current!.clientHeight);
    }

    function handleResize() {
      getHeight();
    }

    if (ref.current) {
      getHeight();
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [ref]);

  return height;
}

interface IActiveProcessTableProps {
  theme: IStyle;
}

function ActiveProcessTable({ theme }: IActiveProcessTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const height = useContainerHeight(containerRef);

  const headerStyle = classNames(
    theme.borderColor['75'],
    'border-r-[0.1vh] border-solid font-bold opacity-60 sm:text-xs md:text-base lg:text-xl xl:text-3xl pl-1',
  );

  return (
    <div className="h-[90%] w-full">
      <div
        className={classNames(
          theme.borderColor['75'],
          theme.backgroundColor.secondary,
          'flex w-full h-fit flex-row flex-nowrap items-center border-[0.1vh] border-solid',
        )}
      >
        <span className={classNames(headerStyle, 'w-[10%]')}>PID</span>
        <span className={classNames(headerStyle, 'w-[23%]')}>Name</span>
        <span className={classNames(headerStyle, 'w-[9%]')}>CPU</span>
        <span className={classNames(headerStyle, 'w-[9%]')}>Memory</span>
        <span className={classNames(headerStyle, 'w-[6%]')}>UID</span>
        <span className={classNames(headerStyle, 'w-[12%]')}>State</span>
        <span className={classNames(headerStyle, 'w-[19%]')}>Started</span>
        <span className={classNames(headerStyle, 'w-[12%]')}>Runtime</span>
      </div>
      <div className="h-[95%] w-full" ref={containerRef}>
        <TableRows height={height} theme={theme} />
      </div>
    </div>
  );
}

export default ActiveProcessTable;
