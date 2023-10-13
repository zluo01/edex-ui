import { IProcessInformation } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { Fragment, useEffect, useState } from 'react';

function ProcessTable() {
  const [processes, setProcesses] = useState<IProcessInformation[]>();

  useEffect(() => {
    const unListen = listen(
      'process_short',
      (e: Event<IProcessInformation[]>) => setProcesses(e.payload),
    );

    return () => {
      unListen.then(f => f()).catch(e => console.error(e));
    };
  }, []);

  function TableRows() {
    return (
      <Fragment>
        {processes?.map(o => (
          <tr key={o.pid}>
            <td className="sm:text-xs md:text-base lg:text-xl xl:text-3xl">
              {o.pid}
            </td>
            <td className="max-w-[7vw] truncate font-bold sm:text-xs md:text-base lg:text-xl xl:text-3xl">
              {o.name}
            </td>
            <td className="text-right sm:text-xs md:text-base lg:text-xl xl:text-3xl">
              {Math.round(o.cpu_usage * 10) / 10}%
            </td>
            <td className="text-right sm:text-xs md:text-base lg:text-xl xl:text-3xl">
              {Math.round(o.memory_usage * 10) / 10}%
            </td>
          </tr>
        ))}
      </Fragment>
    );
  }

  return (
    <table className="w-full table-auto">
      <tbody>
        <TableRows />
      </tbody>
    </table>
  );
}

export default ProcessTable;
