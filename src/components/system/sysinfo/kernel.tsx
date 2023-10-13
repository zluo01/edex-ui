import BaseInformation from '@/components/system/sysinfo/base';
import { useGetKernelVersionQuery } from '@/lib/queries';

function Kernel() {
  const { data: kernel } = useGetKernelVersionQuery();
  return <BaseInformation header={'KERNEL'} value={kernel || 'UNKNOWN'} />;
}

export default Kernel;
