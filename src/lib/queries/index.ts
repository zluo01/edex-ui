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
    throw new Error('Failed to fetch IP information');
  }

  const data: IPInformation = await response.json();

  if (data.status === 'fail') {
    throw new Error('IP API returned fail status');
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
