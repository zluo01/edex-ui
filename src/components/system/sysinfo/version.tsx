import BaseInformation from '@/components/system/sysinfo/base';
import { useGetVersionQuery } from '@/lib/queries';

function Version() {
  const { data: version } = useGetVersionQuery();

  return <BaseInformation header={'V'} value={version || 'UNKNOWN'} />;
}

export default Version;
