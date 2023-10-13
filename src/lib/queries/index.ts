import { getIPInformation } from '@/lib/os';
import { getShowHiddenFileStatus, getTheme } from '@/lib/setting';
import useGetNetworkConnection from '@/lib/utils/network';
import {
  IIPAddressInformation,
  INetworkInformation,
  IStyle,
  OFFLINE,
  ONLINE,
  UNKNOWN,
} from '@/models';
import THEME_LIST from '@/themes/styles';
import { getVersion } from '@tauri-apps/api/app';
import { version } from '@tauri-apps/api/os';
import { useEffect } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

export function useGetVersionQuery() {
  return useSWRImmutable<string>('VERSION', getVersion);
}

export function useGetKernelVersionQuery() {
  return useSWRImmutable<string>('KERNEL', version);
}

export function useGetIpInformationQuery(): INetworkInformation {
  const connection = useGetNetworkConnection();

  const {
    data: information,
    error,
    isLoading,
    mutate,
  } = useSWR<IIPAddressInformation>('IP', getIPInformation);

  useEffect(() => {
    mutate().catch(e => console.error(e));
  }, [connection]);

  if (isLoading) {
    return {
      status: UNKNOWN,
    };
  }

  if (error) {
    return { status: OFFLINE };
  }

  return {
    status: ONLINE,
    information,
  };
}

export function useGetShowHiddenFileStatusQuery() {
  return useSWRImmutable<boolean>('SHOW_HIDDEN_FILE', getShowHiddenFileStatus);
}

export function useGetThemeQuery(): IStyle {
  const { data, isLoading, error } = useSWRImmutable<IStyle>('THEME', getTheme);
  if (isLoading || error || !data) {
    return THEME_LIST[0];
  }
  return data;
}
