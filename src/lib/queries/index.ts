import { errorLog } from '@/lib/log';
import { IIPAddressInformation, IPInformation } from '@/models';
import { QueryClient, queryOptions } from '@tanstack/solid-query';

export const QUERY_CLIENT = new QueryClient();

export const ipInformationQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['ipInfo'],
    queryFn: getIPInformation,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
    enabled,
  });

async function getIPInformation(): Promise<IIPAddressInformation> {
  const response = await fetch(
    'http://ip-api.com/json/?fields=status,countryCode,region,city,query',
    {
      signal: AbortSignal.timeout(3000),
    },
  );

  if (!response.ok) {
    const msg = `Failed to fetch IP information.Status ${response.status}. Error: ${response.statusText}`;
    await errorLog(msg);
    throw new Error(msg);
  }

  const data: IPInformation = await response.json();

  if (data.status === 'fail') {
    const msg = 'IP API returned fail status';
    await errorLog(msg);
    throw new Error(msg);
  }

  return {
    query: data.query,
    location: getGeoLocation(data),
  };
}

function getGeoLocation(data: IPInformation): string {
  if (data.status === 'fail') {
    return 'UNKNOWN';
  }

  const parts = [data.countryCode, data.region, data.city].filter(
    part => part && part.trim() !== '',
  );

  return parts.join('/');
}

export const latencyQueryOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: ['latency'],
    queryFn: getNetworkLatency,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    enabled,
    retry: false,
  });

async function getNetworkLatency(): Promise<string> {
  const start = performance.now();

  try {
    await fetch('https://1.1.1.1/dns-query?name=google.com', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(800),
    });

    const latency = performance.now() - start;
    return `${Math.round(latency)}ms`;
  } catch (error) {
    await errorLog(error);

    // Timeout or network error
    if (error instanceof Error && error.name === 'TimeoutError') {
      return '>800ms';
    }
    return '--';
  }
}
