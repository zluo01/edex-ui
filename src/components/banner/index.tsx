import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { useContext } from 'react';

interface IBannerProps {
  title: string;
  name: string;
}

function Banner({ title, name }: IBannerProps) {
  const theme = useContext(ThemeContext);

  return (
    <div className="flex h-[2.5vh] w-full items-start">
      <div
        className={classNames(
          theme.borderColor['30'],
          'flex flex-row justify-between w-full top-[0.74vh]',
          'border-solid border-b-[0.092vh]',
          'before:content-[""] before:relative before:left-[-0.0925vh] before:top-[0.65vh] before:h-[0.833vh] before:border-solid before:border-l-[0.1vh] before:border-[inherit]',
          'after:content-[""] after:relative after:right-[-0.0925vh] after:top-[0.65vh] after:h-[0.833vh] after:border-solid after:border-r-[0.1vh] after:border-[inherit]',
        )}
      >
        <span className="sm:pl-0.5 sm:text-xxxs md:pl-1.5 md:text-xs lg:pl-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {title}
        </span>
        <div className="flex grow" />
        <span className="sm:pr-0.5 sm:text-xxxs md:pr-1.5 md:text-xs lg:px-2.5 lg:text-sm xl:pl-3.5 xl:text-xl">
          {name}
        </span>
      </div>
    </div>
  );
}

export default Banner;
