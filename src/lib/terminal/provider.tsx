import {
	createContext,
	createSignal,
	type ParentComponent,
	useContext,
} from 'solid-js';

function useProviderValue() {
	const [active, setActive] = createSignal<string>('');
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
		throw new Error('useTerminal must be used within a TerminalProvider');
	}
	return context;
}

export function useActiveTerminal() {
	return useTerminal().active;
}
