import type { JSX } from 'solid-js';

interface BaseInformationProps {
	header: string;
	value: JSX.Element;
}

function BaseInformation(props: BaseInformationProps) {
	return (
		<div class="box-border flex h-full flex-col items-start justify-end py-[0.925vh]">
			<span class="m-0 opacity-50 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
				{props.header}
			</span>
			<span class="m-0 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
				{props.value}
			</span>
		</div>
	);
}

export default BaseInformation;
