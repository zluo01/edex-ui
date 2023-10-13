import BaseInformation from '@/components/network/status/base';
import Latency from '@/components/network/status/latency';
import { useGetIpInformationQuery } from '@/lib/queries';

function ConnectionStatus() {
  const data = useGetIpInformationQuery();

  return (
    <div className="flex h-[7.41vh] w-full flex-col items-start justify-around font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div className="flex w-full flex-row flex-nowrap items-center justify-between">
        <span className="sm:text-xxs md:text-base lg:text-xl xl:text-3xl">
          NETWORK STATUS
        </span>
        <span className="opacity-50 sm:text-xxxs md:text-xs lg:text-lg xl:text-2xl">
          {data.information?.location || 'UNKNOWN'}
        </span>
      </div>
      <div className="grid w-full grid-cols-[25%_50%_25%]">
        <BaseInformation header={'STATE'} value={data.status} />
        <BaseInformation
          header={'IPv4'}
          value={data.information?.query || '--.--.--.--'}
        />
        <Latency />
      </div>
    </div>
  );
}

export default ConnectionStatus;
