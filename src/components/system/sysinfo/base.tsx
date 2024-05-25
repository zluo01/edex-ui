import { JSX, Resource } from 'solid-js';

type IBaseInformationProps = {
  header: string;
  value: Resource<Element> | Resource<string> | (() => JSX.Element);
};

function BaseInformation({ header, value }: IBaseInformationProps) {
  return (
    <div class="box-border flex h-full flex-col items-start justify-end py-[0.925vh]">
      <span class="m-0 opacity-50 sm:text-xs md:text-base lg:text-xl xl:text-3xl">
        {header}
      </span>
      <span class="m-0 sm:text-xs md:text-base lg:text-xl  xl:text-3xl">
        {value()}
      </span>
    </div>
  );
}

export default BaseInformation;
