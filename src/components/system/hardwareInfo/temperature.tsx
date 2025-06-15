import { errorLog } from '@/lib/log';
import { ITemperatureInformation, SystemData } from '@/models';
import { Event, listen } from '@tauri-apps/api/event';
import { createSignal, onCleanup } from 'solid-js';

function Temperature() {
  const [temperature, setTemperature] = createSignal<ITemperatureInformation>();

  const unListen = listen('system', (e: Event<SystemData>) =>
    setTemperature(e.payload.temperature),
  );

  onCleanup(() => {
    unListen.then(f => f()).catch(errorLog);
  });

  return (
    <div class="flex w-full flex-row items-center justify-around py-2">
      <div class="flex flex-col">
        <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">CPU</span>
        <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
          {temperature()?.cpu.toFixed(1) || '--'}°C
        </span>
      </div>
      <div class="flex flex-col">
        <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">GPU</span>
        <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
          {temperature()?.gpu.toFixed(1) || '--'}°C
        </span>
      </div>
      <div class="flex flex-col">
        <span class="sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
          BATTERY
        </span>
        <span class="overflow-hidden opacity-50 sm:text-xs md:text-sm lg:text-xl xl:text-3xl">
          {temperature()?.battery.toFixed(1) || '--'}°C
        </span>
      </div>
    </div>
  );
}

export default Temperature;
