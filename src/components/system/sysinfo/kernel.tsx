import BaseInformation from '@/components/system/sysinfo/base';
import { version } from '@tauri-apps/api/os';
import { createResource } from 'solid-js';

function Kernel() {
  const [kernel] = createResource<string>(version);

  return <BaseInformation header={'KERNEL'} value={kernel} />;
}

export default Kernel;
