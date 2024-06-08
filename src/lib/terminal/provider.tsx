import {
  createContext,
  createSignal,
  ParentComponent,
  useContext,
} from 'solid-js';

function useProviderValue() {
  const [active, setActive] = createSignal<number>(0);
  return { active, setActive };
}

type ContextType = ReturnType<typeof useProviderValue>;

const ActiveTerminalContext = createContext<ContextType | undefined>(undefined);

export const TerminalProvider: ParentComponent = props => {
  const value = useProviderValue();
  return (
    <ActiveTerminalContext.Provider value={value}>
      {props.children}
    </ActiveTerminalContext.Provider>
  );
};

export function useTerminal() {
  const context = useContext(ActiveTerminalContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useActiveTerminal() {
  return useTerminal().active;
}
