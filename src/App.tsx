import FileSystem from '@/components/filesystem';
import Network from '@/components/network';
import System from '@/components/system';
import Terminal from '@/components/terminal';
import { useCurrentTheme } from '@/lib/themes';
import clsx from 'clsx';

function App() {
  const theme = useCurrentTheme();

  return (
    <div
      class={clsx(
        theme().textColor.main,
        theme().backgroundColor.main,
        'flex size-full flex-col flex-nowrap',
      )}
    >
      <div class="flex h-[62vh] w-full flex-row flex-nowrap">
        <System />
        <Terminal />
        <Network />
      </div>
      <FileSystem />
    </div>
  );
}

export default App;
