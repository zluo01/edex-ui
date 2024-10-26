import { getTheme, setTheme } from '@/lib/setting';
import { Theme } from '@/lib/themes/styles';
import {
  createContext,
  createEffect,
  createResource,
  on,
  ParentComponent,
  useContext,
} from 'solid-js';

function useProviderValue() {
  const [theme, { mutate }] = createResource<Theme>(getTheme, {
    initialValue: Theme.TRON,
  });

  createEffect(
    on(theme, t =>
      document.documentElement.setAttribute('data-theme', t.toLowerCase()),
    ),
  );

  const updateTheme = async (t: Theme) => {
    await setTheme(t);
    mutate(t);
  };

  return { theme, updateTheme };
}

type ContextType = ReturnType<typeof useProviderValue>;

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
