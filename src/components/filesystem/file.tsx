import { createMemo, For, type Resource } from 'solid-js';
import FileTile from '@/components/filesystem/tile';
import { openFile, writeToSession } from '@/lib/os';
import { useActiveTerminal } from '@/lib/terminal';
import {
	BACKWARD,
	DIRECTORY,
	FILE,
	type FileInfo,
	type FileSystemStatus,
	SETTING,
} from '@/models';

interface FileSectionProps {
	open: VoidFunction;
	showHidden: Resource<boolean>;
	fileSystem: () => FileSystemStatus | undefined;
}

function FileSection(props: FileSectionProps) {
	const active = useActiveTerminal();

	const filteredFiles = createMemo(
		() =>
			props.fileSystem()?.files.filter(o => !o.hidden || props.showHidden()) ??
			[],
	);

	async function fileAction(file: FileInfo) {
		if (file.t === DIRECTORY) {
			await writeToSession(active(), `cd '${file.path}'\n`);
		} else if (file.t === FILE) {
			await openFile(file.path);
		}
	}

	return (
		<>
			<FileTile
				name={'Setting'}
				t={SETTING}
				hidden={false}
				onClick={props.open}
			/>
			<FileTile
				name={'Go back'}
				t={BACKWARD}
				hidden={false}
				onClick={() => writeToSession(active(), 'cd ../\n')}
			/>
			<For each={filteredFiles()}>
				{file => <FileTile {...file} onClick={() => fileAction(file)} />}
			</For>
		</>
	);
}

export default FileSection;
