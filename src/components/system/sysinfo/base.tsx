import { ReactElement } from 'react';

interface IBaseInformationProps {
  header: string;
  value?: string | ReactElement;
}

function BaseInformation({ header, value }: IBaseInformationProps) {
  return (
    <div className="box-border flex h-full flex-col items-start justify-end py-[0.925vh]">
      <span className="m-0 opacity-50 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
        {header}
      </span>
      <span className="m-0 sm:text-xs md:text-base lg:text-xl  xl:text-3xl">
        {value}
      </span>
    </div>
  );
}

export default BaseInformation;
