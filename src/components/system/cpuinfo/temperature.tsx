import { ITemperatureInformation } from '@/models';

interface ITempDisplayProps {
  name: string;
  temp?: number;
}
function TempDisplay({ name, temp }: ITempDisplayProps) {
  return (
    <div className="flex flex-col">
      <span className="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
        {name}
      </span>
      <span className="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
        {temp?.toFixed(1) || '--'}°C
      </span>
    </div>
  );
}

interface ISystemTemperatureProps {
  temperature?: ITemperatureInformation;
}

function SystemTemperature({ temperature }: ISystemTemperatureProps) {
  return (
    <div className="flex w-full flex-row items-center justify-around py-2">
      <TempDisplay name={'CPU'} temp={temperature?.cpu} />
      <TempDisplay name={'GPU'} temp={temperature?.gpu} />
      <TempDisplay name={'BATTERY'} temp={temperature?.battery} />
    </div>
  );
}

export default SystemTemperature;
