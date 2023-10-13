import formatTime from '@/lib/utils/format';
import classNames from '@/lib/utils/style';
import { Fragment, useEffect, useState } from 'react';

interface IClockProps {
  date: Date;
}

function ClockText({ date }: IClockProps) {
  function getClockText(): string {
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();

    return `${formatTime(hour)}:${formatTime(min)}:${formatTime(sec)}`;
  }

  function Time() {
    const timeText = getClockText();
    return Array.from(timeText).map((v, i) => {
      if (v === ':') {
        return (
          <em
            key={i}
            className="mx-[0.3vh] my-0 inline-block w-[2.5vh] text-center not-italic"
          >
            :
          </em>
        );
      }
      return (
        <span
          key={i}
          className="mx-[0.2vh] my-0 inline-block w-[2.3vh] text-center"
        >
          {v}
        </span>
      );
    });
  }

  return (
    <Fragment>
      <Time />
    </Fragment>
  );
}

function Clock() {
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    // Update localTime every second
    const intervalId = setInterval(() => {
      setDate(new Date());
    }, 1000);

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div
      className={classNames(
        'font-united_sans_light h-[7.41vh] w-full flex items-center justify-around font-extrabold sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl',
      )}
    >
      <ClockText date={date} />
    </div>
  );
}

export default Clock;
