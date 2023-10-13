interface IBaseInformationProps {
  header: string;
  value?: string;
}

function BaseInformation({ header, value }: IBaseInformationProps) {
  return (
    <div className="box-border flex h-full flex-col items-start justify-around [&:nth-child(2)]:pl-1.5">
      <span className="m-0 opacity-50 sm:text-xs md:text-lg lg:text-xl xl:text-3xl">
        {header}
      </span>
      <span className="m-0 sm:text-xxxs md:text-sm lg:text-base xl:text-2xl">
        {value}
      </span>
    </div>
  );
}

export default BaseInformation;
