import classNames from '@/lib/utils/style';
import { IMemoryInformation } from '@/models';
import ThemeContext from '@/themes/provider';
import { Event, listen } from '@tauri-apps/api/event';
import { Fragment, useContext, useEffect, useState } from 'react';

function MemInfo() {
  const theme = useContext(ThemeContext);

  const [memory, setMemory] = useState<IMemoryInformation>();

  useEffect(() => {
    const unListen = listen('memory', (e: Event<IMemoryInformation>) =>
      setMemory(e.payload),
    );

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, []);

  function MemoryMap() {
    const backgroundColor = theme.backgroundColor.active;

    if (!memory) {
      return (
        <Fragment>
          {Array.from({ length: 440 }, (_, i) => (
            <div
              key={i}
              className={classNames(
                backgroundColor,
                'w-[0.2vh] h-[0.2vh]',
                'opacity-25',
              )}
            />
          ))}
        </Fragment>
      );
    }
    const active = memory.active;
    const available = memory.available;
    const free = 440 - active - available;

    return (
      <Fragment>
        {Array.from({ length: free }, (_, i) => (
          <div
            key={`free-${i}`}
            className={classNames(
              backgroundColor,
              'w-[0.2vh] h-[0.2vh]',
              'opacity-25',
            )}
          />
        ))}
        {Array.from({ length: available }, (_, i) => (
          <div
            key={`available-${i}`}
            className={classNames(
              backgroundColor,
              'w-[0.2vh] h-[0.2vh]',
              'opacity-50',
            )}
          />
        ))}
        {Array.from({ length: active }, (_, i) => (
          <div
            key={`active-${i}`}
            className={classNames(
              backgroundColor,
              'w-[0.2vh] h-[0.2vh]',
              'opacity-100',
            )}
          />
        ))}
      </Fragment>
    );
  }

  function getMemoryText() {
    if (!memory) {
      return '';
    }
    return `USING ${memory.used} OUT OF ${memory.total} GiB`;
  }

  return (
    <div className="w-full font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div className="flex flex-row flex-nowrap items-center justify-between">
        <span className="sm:text-xs md:text-base lg:text-2xl xl:text-4xl">
          MEMORY
        </span>
        <span className="opacity-50 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          {getMemoryText()}
        </span>
      </div>
      <div className="mb-[0.8vh] grid grid-flow-row grid-cols-[repeat(40,_1fr)] grid-rows-[repeat(11,_1fr)] gap-[0.23vh] pt-[0.5vh]">
        <MemoryMap />
      </div>
      <div className="mb-[0.5vh] grid grid-cols-[15%_65%_20%] items-center">
        <span className="m-0 self-center sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          SWAP
        </span>
        <div
          className={classNames(
            theme.borderColor['80'],
            'flex w-full h-[75%] flex-col items-start justify-center border-r-[0.1vh] border-solid',
          )}
        >
          <div
            className={classNames(
              theme.backgroundColor.active,
              'relative h-[0.4vh] w-full opacity-60 duration-500 ease-in',
            )}
            style={{
              width: `${memory?.ratio || 0}%`,
            }}
          />
          <div
            className={classNames(
              theme.backgroundColor.active,
              'relative h-[0.25vh] w-full self-center opacity-80',
            )}
          />
        </div>
        <span className="m-0 self-center whitespace-nowrap text-right not-italic opacity-50 sm:text-xxs md:text-sm lg:text-lg xl:text-2xl">
          {memory?.swap || '0.0'} GiB
        </span>
      </div>
    </div>
  );
}

export default MemInfo;
