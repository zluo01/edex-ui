import DiskDisplay from '@/components/network/disk/usage';

function DiskUsage() {
  return (
    <div className="flex h-[28vh] w-full flex-col flex-nowrap overflow-auto font-united_sans_light tracking-[0.092vh] sm:px-0.5 md:px-1.5 lg:px-2.5 xl:px-3.5">
      <div className="flex flex-row flex-nowrap items-center justify-start">
        <span className="sm:text-xs md:text-base lg:text-xl xl:text-4xl">
          DISK USAGE
        </span>
      </div>
      <DiskDisplay />
    </div>
  );
}

export default DiskUsage;
