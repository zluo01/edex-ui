import { cn } from '@/lib/utils';

interface IBannerProps {
  title: string;
  name: string;
}

function Banner(props: IBannerProps) {
  return (
    <div class="flex h-[2.5vh] w-full items-start">
      <div
        class={cn(
          'top-[0.74vh] flex w-full flex-row justify-between',
          'border-default/30 border-b-[0.092vh] border-solid',
          'before:relative before:top-[0.65vh] before:left-[-0.0925vh] before:h-[0.833vh] before:border-l-[0.1vh] before:border-solid before:border-inherit before:content-[""]',
          'after:relative after:top-[0.65vh] after:right-[-0.0925vh] after:h-[0.833vh] after:border-r-[0.1vh] after:border-solid after:border-inherit after:content-[""]',
        )}
      >
        <span class="sm:text-xxxs sm:pl-0.5 md:pl-1.5 md:text-xs lg:pl-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {props.title}
        </span>
        <div class="flex grow" />
        <span class="sm:text-xxxs sm:pr-0.5 md:pr-1.5 md:text-xs lg:px-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {props.name}
        </span>
      </div>
    </div>
  );
}

export default Banner;
