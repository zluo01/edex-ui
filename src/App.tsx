import FileSystem from '@/components/filesystem';
import Network from '@/components/network';
import System from '@/components/system';
import Terminal from '@/components/terminal';

function App() {
  return (
    <div class="bg-main text-main flex size-full flex-col flex-nowrap">
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
