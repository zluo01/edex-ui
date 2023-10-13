import classNames from '@/lib/utils/style';
import { IProcessInformation, IStyle } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

function useGetRowSize(): number {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setScreenWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (screenWidth < 1920) {
    return 18;
  } else if (screenWidth < 2560) {
    return 26;
  } else if (screenWidth < 3840) {
    return 30;
  }
  return 40;
}
interface ITableRowsProps {
  height: number;
  theme: IStyle;
}

function TableRows({ theme, height }: ITableRowsProps) {
  const rowSize = useGetRowSize();
  const [processes, setProcesses] = useState<IProcessInformation[]>();

  useEffect(() => {
    const unListen = listen('process', (e: Event<IProcessInformation[]>) =>
      setProcesses(e.payload),
    );

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, []);

  function epochTimeToActualDate(epochTime: number): string {
    const date = new Date(0); // The 0 represents the epoch date
    date.setUTCSeconds(epochTime);
    return date.toDateString();
  }

  const styles = classNames(
    theme.borderColor['75'],
    'border-r-[0.1vh] border-solid sm:text-xs md:text-base lg:text-xl xl:text-3xl pl-1 truncate',
  );

  if (!processes) {
    return <div />;
  }
  return (
    <List
      height={height}
      itemCount={processes.length}
      itemSize={rowSize}
      itemData={processes}
      width={'100%'}
      className={'no-scrollbar appearance-none'}
    >
      {({ index, style }) => {
        const process = processes[index];
        return (
          <div
            style={style}
            className={classNames(
              theme.borderColor['75'],
              'flex h-full w-full flex-row flex-nowrap items-center border-[0.1vh] border-solid',
            )}
          >
            <span className={classNames(styles, 'w-[10%]')}>{process.pid}</span>
            <span
              className={classNames(styles, 'w-[23%]')}
              title={process.name}
            >
              {process.name}
            </span>
            <span className={classNames(styles, 'w-[9%]')}>
              {Math.round(process.cpu_usage * 10) / 10}%
            </span>
            <span className={classNames(styles, 'w-[9%]')}>
              {Math.round(process.memory_usage * 10) / 10}%
            </span>
            <span className={classNames(styles, 'w-[6%]')}>{process.uid}</span>
            <span className={classNames(styles, 'w-[12%]')}>
              {process.state}
            </span>
            <span className={classNames(styles, 'w-[19%]')}>
              {epochTimeToActualDate(process.start_time)}
            </span>
            <span className={classNames(styles, 'w-[12%]')}>
              {process.run_time}
            </span>
          </div>
        );
      }}
    </List>
  );
}

export default TableRows;
