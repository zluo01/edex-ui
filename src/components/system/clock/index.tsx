import { createDateNow } from '@solid-primitives/date';
import { formatTime } from '@/lib/utils';

const digitClass = 'mx-[0.2vh] my-0 inline-block w-[2.3vh] text-center';
const colonClass =
	'mx-[0.3vh] my-0 inline-block w-[2.5vh] text-center not-italic';

function Clock() {
	const [date] = createDateNow(1000);

	const hours = () => formatTime(date().getHours());
	const minutes = () => formatTime(date().getMinutes());
	const seconds = () => formatTime(date().getSeconds());

	return (
		<div class="font-united_sans_light flex h-[7.41vh] w-full items-center justify-around font-extrabold sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl">
			<span class={digitClass}>{hours()[0]}</span>
			<span class={digitClass}>{hours()[1]}</span>
			<em class={colonClass}>:</em>
			<span class={digitClass}>{minutes()[0]}</span>
			<span class={digitClass}>{minutes()[1]}</span>
			<em class={colonClass}>:</em>
			<span class={digitClass}>{seconds()[0]}</span>
			<span class={digitClass}>{seconds()[1]}</span>
		</div>
	);
}

export default Clock;
