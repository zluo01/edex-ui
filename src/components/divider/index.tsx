import { cn } from '@/lib/utils';

function Divider() {
  return (
    <div
      class={cn(
        'border-default/30 flex h-0 w-full justify-between border-t-[0.092vh] border-solid px-0 pt-[0.645vh]',
        'before:relative before:top-[-1.111vh] before:left-[-0.092vh] before:h-[0.833vh] before:border-l-[0.092vh] before:border-solid before:border-inherit before:content-[""]',
        'after:relative after:top-[-1.111vh] after:right-[-0.092vh] after:h-[0.833vh] after:border-r-[0.092vh] after:border-solid after:border-inherit after:content-[""]',
      )}
    />
  );
}

export default Divider;
