import FileSystem from '@/components/filesystem';
import Network from '@/components/network';
import System from '@/components/system';
import Terminal from '@/components/terminal';
import { onCleanup } from 'solid-js';

function App() {
  const isDev = window.location.host.startsWith('localhost:');
  // Disable the default context menu on production builds
  if (!isDev) {
    window.addEventListener('contextmenu', e => e.preventDefault());
  }

  onCleanup(() => {
    if (!isDev) {
      window.removeEventListener('contextmenu', e => e.preventDefault());
    }
  });

  return (
    <div class="flex size-full flex-col flex-nowrap bg-main text-main">
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
