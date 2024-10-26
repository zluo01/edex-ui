import BaseInformation from '@/components/system/sysinfo/base';
import { version } from '@tauri-apps/plugin-os';
import { createResource } from 'solid-js';

function Version() {
  const [v] = createResource(version);

  return <BaseInformation header={/*@once*/ 'V'} value={/*@once*/ <>{v}</>} />;
}

export default Version;
