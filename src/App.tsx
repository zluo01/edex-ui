import FileSystem from '@/components/filesystem';
import Network from '@/components/network';
import System from '@/components/system';
import Terminal from '@/components/terminal';

function App() {
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
