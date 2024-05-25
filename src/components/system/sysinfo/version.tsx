import BaseInformation from '@/components/system/sysinfo/base';
import { getVersion } from '@tauri-apps/api/app';
import { createResource } from 'solid-js';

function Version() {
  const [version] = createResource(getVersion);

  return <BaseInformation header={'V'} value={version} />;
}

export default Version;
