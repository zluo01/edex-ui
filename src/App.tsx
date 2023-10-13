import FileSystem from '@/components/filesystem';
import Network from '@/components/network';
import System from '@/components/system';
import Terminal from '@/components/terminal';
import { useGetThemeQuery } from '@/lib/queries';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';

function App() {
  const theme = useGetThemeQuery();

  return (
    <ThemeContext.Provider value={theme}>
      <div
        className={classNames(
          theme.textColor.main,
          theme.backgroundColor.main,
          'flex h-full w-full flex-col flex-nowrap',
        )}
      >
        <div className="flex h-[62vh] w-full flex-row flex-nowrap">
          <System />
          <Terminal />
          <Network />
        </div>
        <FileSystem />
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
