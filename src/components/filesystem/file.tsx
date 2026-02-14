import { For, type Resource } from 'solid-js';
import FileTile from '@/components/filesystem/tile';
import { openFile, writeToSession } from '@/lib/os';
import { useActiveTerminal } from '@/lib/terminal';
import {
	BACKWARD,
	DIRECTORY,
	FILE,
	type IFileInfo,
	type IFileSystem,
	SETTING,
} from '@/models';

interface IFileSectionProps {
	open: VoidFunction;
	showHidden: Resource<boolean>;
	fileSystem: () => IFileSystem | undefined;
}

function FileSection(props: IFileSectionProps) {
	const active = useActiveTerminal();

	async function fileAction(file: IFileInfo) {
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
			<For
				each={props
					.fileSystem()
					?.files.filter(o => !o.hidden || props.showHidden())}
			>
				{file => <FileTile {...file} onClick={() => fileAction(file)} />}
			</For>
		</>
	);
}

export default FileSection;
