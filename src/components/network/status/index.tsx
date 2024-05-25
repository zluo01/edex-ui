import { getIPInformation, getNetworkLatency } from '@/lib/os';
import { NETWORK_STATUS, OFFLINE, ONLINE } from '@/models';
import {
  Component,
  createResource,
  createSignal,
  onCleanup,
  Resource,
} from 'solid-js';

interface IBaseInformationProps {
  header: string;
  value: Resource<string> | (() => string);
}

function BaseInformation({ header, value }: IBaseInformationProps) {
  return (
    <div class="box-border flex h-full flex-col items-start justify-around [&:nth-child(2)]:pl-1.5">
      <span class="m-0 opacity-50 sm:text-xs md:text-lg lg:text-xl xl:text-3xl">
        {header}
      </span>
      <span class="m-0 sm:text-xxxs md:text-sm lg:text-base xl:text-2xl">
        {value()}
      </span>
    </div>
  );
}

async function latencyString() {
  try {
    const latency = await getNetworkLatency();
    return `${latency}ms`;
  } catch (e) {
    console.error(e);
    return '--';
  }
}

type ConnectionStatusProps = {
  connected: () => boolean;
};

const ConnectionStatus: Component<ConnectionStatusProps> = ({ connected }) => {
  const [information] = createResource(connected, getIPInformation);

  const [latency, setLatency] = createSignal<string>('--');

  const intervalId = setInterval(() => {
    latencyString()
      .then(v => setLatency(v))
      .catch(e => console.error(e));
  }, 1000);

  onCleanup(() => clearInterval(intervalId));

  const status = (): NETWORK_STATUS => (connected() ? ONLINE : OFFLINE);

  const location = () => information()?.location || 'UNKNOWN';
  const query = () => information()?.query || '--.--.--.--';

  return (
    <div class="flex h-[7.41vh] w-full flex-col items-start justify-around font-united_sans_light text-[1.111vh] tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div class="flex w-full flex-row flex-nowrap items-center justify-between">
        <span class="sm:text-xxs md:text-base lg:text-xl xl:text-3xl">
          NETWORK STATUS
        </span>
        <span class="opacity-50 sm:text-xxxs md:text-xs lg:text-lg xl:text-2xl">
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
};

export default ConnectionStatus;
