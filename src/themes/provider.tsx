import { getTheme, setTheme } from '@/lib/setting';
import { IStyle } from '@/models';
import THEME_LIST from '@/themes/styles';
import {
  createContext,
  useContext,
  createResource,
  ParentComponent,
} from 'solid-js';

function useProviderValue() {
  const [theme, { mutate }] = createResource<IStyle>(getTheme, {
    initialValue: THEME_LIST[0],
  });

  const updateTheme = async (index: number) => {
    if (index < 0 || index > THEME_LIST.length - 1) {
      throw new Error('Invalid index: ' + index);
    }
    const newTheme = THEME_LIST[index];
    await setTheme(newTheme);
    mutate(newTheme);
  };

  return { theme, updateTheme };
}

export type ContextType = ReturnType<typeof useProviderValue>;

const ThemeContext = createContext<ContextType | undefined>(undefined);

export const ThemeProvider: ParentComponent = props => {
  const value = useProviderValue();
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useCurrentTheme() {
  return useTheme().theme;
}
