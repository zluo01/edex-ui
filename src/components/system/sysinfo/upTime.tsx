import { type JSX, Show } from 'solid-js';
import BaseInformation from '@/components/system/sysinfo/base';
import { useSystemData } from '@/lib/system';
import { formatTime } from '@/lib/utils';

function UpTimeSection() {
	const systemData = useSystemData();

	const uptime = () => systemData()?.uptime ?? 0;

	function UpTime(): JSX.Element {
		let raw = uptime();

		const days = Math.floor(raw / 86400);
		raw -= days * 86400;
		const hours = Math.floor(raw / 3600);
		raw -= hours * 3600;
		const minutes = Math.floor(raw / 60);
		return (
			<>
				{days}
				<span class="opacity-50">d</span>
				{formatTime(hours)}
				<span class="opacity-50">:</span>
				{formatTime(minutes)}
			</>
		);
	}

	return (
		<BaseInformation
			header={/*@once*/ 'UPTIME'}
			value={
				<Show when={uptime()} fallback={<>0:0:0</>}>
					<UpTime />
				</Show>
			}
		/>
	);
}

export default UpTimeSection;
