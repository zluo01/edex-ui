import { getNetworkLatency } from '@/lib/os';
import { ipInformationQueryOptions } from '@/lib/queries';
import { NETWORK_STATUS, OFFLINE, ONLINE } from '@/models';
import { useQuery } from '@tanstack/solid-query';
import { Accessor, createResource, JSX, onCleanup } from 'solid-js';

interface IBaseInformationProps {
  header: string;
  value: Accessor<string>;
}

function BaseInformation(props: IBaseInformationProps) {
  return (
    <div class="box-border flex h-full flex-col items-start justify-around nth-2:pl-1.5">
      <span class="m-0 opacity-50 sm:text-xs md:text-lg lg:text-xl xl:text-3xl">
        {props.header}
      </span>
      <span class="sm:text-xxxs m-0 md:text-sm lg:text-base xl:text-2xl">
        {props.value()}
      </span>
    </div>
  );
}

type ConnectionStatusProps = {
  connected: Accessor<boolean>;
};

function ConnectionStatus(props: ConnectionStatusProps): JSX.Element {
  const ipInformationQuery = useQuery(() =>
    ipInformationQueryOptions(props.connected()),
  );

  const [latency, { refetch }] = createResource<string>(getNetworkLatency, {
    initialValue: '--',
  });

  const intervalId = setInterval(() => {
    refetch();
  }, 1000);

  onCleanup(() => clearInterval(intervalId));

  const status = (): NETWORK_STATUS => (props.connected() ? ONLINE : OFFLINE);

  const location = () => {
    if (!props.connected()) return 'DISCONNECTED';
    return ipInformationQuery.data?.location || 'UNKNOWN';
  };

  const query = () => {
    if (!props.connected()) return '--.--.--.--';
    return ipInformationQuery.data?.query || '--.--.--.--';
  };

  return (
    <div class="font-united_sans_light flex h-[7.41vh] w-full flex-col items-start justify-around text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <span class="sm:text-xxs md:text-base lg:text-xl xl:text-3xl">
          NETWORK STATUS
        </span>
        <span class="sm:text-xxxs opacity-50 md:text-xs lg:text-lg xl:text-2xl">
          {location()}
        </span>
      </div>
      <div class="grid w-full grid-cols-[25%_50%_25%]">
        <BaseInformation header={'STATE'} value={status} />
        <BaseInformation header={'IPv4'} value={query} />
        <BaseInformation header={'PING'} value={latency} />
      </div>
    </div>
  );
}

export default ConnectionStatus;
