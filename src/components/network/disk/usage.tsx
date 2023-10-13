import { IDiskUsage } from '@/models';
import ThemeContext from '@/themes/provider';
import { Event, listen } from '@tauri-apps/api/event';
import isEqual from 'lodash/isEqual';
import prettyBytes from 'pretty-bytes';
import { Fragment, useContext, useEffect, useState } from 'react';

function DiskDisplay() {
  const theme = useContext(ThemeContext);

  const [disks, setDisks] = useState<IDiskUsage[]>();

  useEffect(() => {
    const unListen = listen('disk', (e: Event<IDiskUsage[]>) =>
      setDisks(prevState =>
        isEqual(prevState, e.payload) ? prevState : e.payload,
      ),
    );

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, [disks]);

  return (
    <Fragment>
      {disks?.map((disk, i) => (
        <div
          key={i}
          className="flex flex-col"
          style={{
            background: `linear-gradient(to right, ${theme.colors.grey} ${disk.usage}%, transparent 80%)`,
          }}
        >
          <div className="flex flex-row items-center justify-between">
            <span className="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
              {disk.name}
            </span>
            <span className="sm:text-xxs md:text-sm  lg:text-lg xl:text-3xl">
              {disk.internal ? 'Internal' : 'External'}
            </span>
          </div>
          <div className="flex flex-row items-center justify-between">
            <span className="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
              {prettyBytes(disk.total)}
            </span>
            <span className="sm:text-xxxs md:text-xs lg:text-base xl:text-2xl">
              {prettyBytes(disk.available)} Free
            </span>
          </div>
        </div>
      ))}
    </Fragment>
  );
}

export default DiskDisplay;
