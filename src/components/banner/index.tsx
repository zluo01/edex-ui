import { useCurrentTheme } from '@/lib/themes';
import clsx from 'clsx';

interface IBannerProps {
  title: string;
  name: string;
}

function Banner(props: IBannerProps) {
  const theme = useCurrentTheme();

  return (
    <div class="flex h-[2.5vh] w-full items-start">
      <div
        class={clsx(
          theme().borderColor['30'],
          'top-[0.74vh] flex w-full flex-row justify-between',
          'border-b-[0.092vh] border-solid',
          'before:relative before:left-[-0.0925vh] before:top-[0.65vh] before:h-[0.833vh] before:border-l-[0.1vh] before:border-solid before:border-[inherit] before:content-[""]',
          'after:relative after:right-[-0.0925vh] after:top-[0.65vh] after:h-[0.833vh] after:border-r-[0.1vh] after:border-solid after:border-[inherit] after:content-[""]',
        )}
      >
        <span class="sm:pl-0.5 sm:text-xxxs md:pl-1.5 md:text-xs lg:pl-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {props.title}
        </span>
        <div class="flex grow" />
        <span class="sm:pr-0.5 sm:text-xxxs md:pr-1.5 md:text-xs lg:px-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {props.name}
        </span>
      </div>
    </div>
  );
}

export default Banner;
