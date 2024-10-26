import BaseInformation from '@/components/system/sysinfo/base';
import { getKernelVersion } from '@/lib/os';
import { createResource } from 'solid-js';

function Kernel() {
  const [kernel] = createResource<string>(getKernelVersion);

  return (
    <BaseInformation
      header={/*@once*/ 'KERNEL'}
      value={/*@once*/ <>{kernel}</>}
    />
  );
}

export default Kernel;
