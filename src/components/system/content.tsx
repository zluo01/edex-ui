import Divider from '@/components/divider';
import Clock from '@/components/system/clock';
import HardwareInfo from '@/components/system/hardwareInfo';
import MemInfo from '@/components/system/meminfo';
import Process from '@/components/system/process';
import SysInfo from '@/components/system/sysinfo';
import { SystemDataProvider } from '@/lib/system';

function MainContent() {
	return (
		<SystemDataProvider>
			<Divider />
			<Clock />
			<Divider />
			<SysInfo />
			<Divider />
			<HardwareInfo />
			<Divider />
			<MemInfo />
			<Divider />
			<Process />
		</SystemDataProvider>
	);
}

export default MainContent;
