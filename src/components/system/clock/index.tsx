import { formatTime } from '@/lib/utils';
import { createDateNow } from '@solid-primitives/date';

function Clock() {
  const [date] = createDateNow(1000);

  const clockText = () => {
    const time = `${formatTime(date().getHours())}:${formatTime(date().getMinutes())}:${formatTime(date().getSeconds())}`;
    return Array.from(time).map(v => {
      if (v === ':') {
        return (
          <em class="mx-[0.3vh] my-0 inline-block w-[2.5vh] text-center not-italic">
            :
          </em>
        );
      }
      return (
        <span class="mx-[0.2vh] my-0 inline-block w-[2.3vh] text-center">
          {v}
        </span>
      );
    });
  };

  return (
    <div class="font-united_sans_light flex h-[7.41vh] w-full items-center justify-around font-extrabold sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl">
      {clockText()}
    </div>
  );
}

export default Clock;
