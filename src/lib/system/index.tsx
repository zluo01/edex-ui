import { type Event, listen } from '@tauri-apps/api/event';
import {
	createContext,
	createSignal,
	onCleanup,
	type ParentComponent,
	useContext,
} from 'solid-js';
import { errorLog } from '@/lib/log';
import type { SystemData } from '@/models';

function useProviderValue() {
	const [systemData, setSystemData] = createSignal<SystemData>();

	const unListen = listen('system', (e: Event<SystemData>) =>
		setSystemData(e.payload),
	);

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	return systemData;
}

type ContextType = ReturnType<typeof useProviderValue>;

const SystemDataContext = createContext<ContextType | undefined>(undefined);

export const SystemDataProvider: ParentComponent = props => {
	const value = useProviderValue();
	return (
		<SystemDataContext.Provider value={value}>
			{props.children}
		</SystemDataContext.Provider>
	);
};

export function useSystemData() {
	const context = useContext(SystemDataContext);
	if (context === undefined) {
		throw new Error('useSystemData must be used within a SystemDataProvider');
	}
	return context;
}
