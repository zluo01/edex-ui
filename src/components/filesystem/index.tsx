import { type Event, listen } from '@tauri-apps/api/event';
import { createResource, createSignal, lazy, onCleanup } from 'solid-js';
import Banner from '@/components/banner';
import { errorLog } from '@/lib/log';
import {
	getShowHiddenFileStatus,
	setShowHiddenFileStatus,
} from '@/lib/setting';
import type { FileSystemStatus } from '@/models';

const FileSection = lazy(() => import('@/components/filesystem/file'));

const Setting = lazy(() => import('@/components/setting'));

function FileSystem() {
	const [showHidden, { mutate }] = createResource(getShowHiddenFileStatus);

	async function change() {
		const v = !showHidden();
		await setShowHiddenFileStatus(v);
		mutate(v);
	}

	const [fileSystem, setFileSystem] = createSignal<FileSystemStatus>();

	const unListen = listen('files', (e: Event<FileSystemStatus>) =>
		setFileSystem(e.payload),
	);

	onCleanup(() => {
		unListen.then(f => f()).catch(errorLog);
	});

	return (
		<>
			<div class="relative flex size-full max-h-[38vh] flex-col justify-between sm:p-1 md:p-2 lg:p-3">
				<Banner
					title={/*@once*/ 'FILESYSTEM'}
					name={fileSystem()?.path || ''}
				/>
				<div class="no-scrollbar animate-fade-delay-200 relative box-border grid h-full max-h-[34vh] min-h-[25.5vh] appearance-none auto-rows-[8.5vh] grid-cols-[repeat(auto-fill,minmax(8.5vh,1fr))] gap-[1vh] overflow-auto">
					<FileSection showHidden={showHidden} fileSystem={fileSystem} />
				</div>
			</div>
			<Setting showHidden={showHidden} changeHidden={change} />
		</>
	);
}

export default FileSystem;
