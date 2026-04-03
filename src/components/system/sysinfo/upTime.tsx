import { Show } from 'solid-js';
import BaseInformation from '@/components/system/sysinfo/base';
import { useSystemData } from '@/lib/system';
import { formatTime } from '@/lib/utils';

function UpTimeSection() {
	const systemData = useSystemData();

	const uptime = () => systemData()?.uptime ?? 0;

	const days = () => Math.floor(uptime() / 86400);
	const hours = () => Math.floor((uptime() % 86400) / 3600);
	const minutes = () => Math.floor((uptime() % 3600) / 60);

	return (
		<BaseInformation
			header={/*@once*/ 'UPTIME'}
			value={
				<Show when={uptime()} fallback={<>0:0:0</>}>
					{days()}
					<span class="opacity-50">d</span>
					{formatTime(hours())}
					<span class="opacity-50">:</span>
					{formatTime(minutes())}
				</Show>
			}
		/>
	);
}

export default UpTimeSection;
