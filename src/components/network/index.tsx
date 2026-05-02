import { lazy } from 'solid-js';
import Banner from '@/components/banner';

const NetworkContent = lazy(() => import('@/components/network/content'));

function Network() {
	return (
		<div class="border-default/30 relative box-border flex h-full w-[16vw] flex-col items-end sm:px-1 md:px-2 lg:px-3">
			<Banner title={/*@once*/ 'PANEL'} name={/*@once*/ 'NETWORK'} />
			<div class="animate-fade-delay-100 size-full">
				<NetworkContent />
			</div>
		</div>
	);
}

export default Network;
