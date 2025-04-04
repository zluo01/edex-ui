import { cn } from '@/lib/utils';
import { BACKWARD, DIRECTORY, FILE, FileType, SETTING } from '@/models';
import { JSX, Match, Switch } from 'solid-js';

interface IIconProps {
  t: FileType;
  hidden: boolean;
}

function Icon(props: IIconProps): JSX.Element {
  return (
    <Switch
      fallback={
        <svg
          viewBox="0 0 24 24"
          class={cn(
            props.hidden && 'opacity-70',
            'fill-current sm:size-12 md:size-20 lg:size-28 xl:size-40',
          )}
        >
          <path d="M11 18h2v-2h-2v2Zm1-12c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4ZM5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        </svg>
      }
    >
      <Match when={props.t === DIRECTORY}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={cn(
            props.hidden && 'opacity-70',
            'fill-current sm:size-12 md:size-20 lg:size-28 xl:size-40',
          )}
          viewBox="0 0 512 512"
        >
          <path d="M64 480H448c35.3 0 64-28.7 64-64V160c0-35.3-28.7-64-64-64H288c-10.1 0-19.6-4.7-25.6-12.8L243.2 57.6C231.1 41.5 212.1 32 192 32H64C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64z" />
        </svg>
      </Match>
      <Match when={props.t === FILE}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={cn(
            props.hidden && 'opacity-70',
            'fill-current sm:size-12 md:size-20 lg:size-28 xl:size-40',
          )}
          viewBox="0 0 384 512"
        >
          <path d="M0 64C0 28.7 28.7 0 64 0H224V128c0 17.7 14.3 32 32 32H384V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384 64H256V0L384 128z" />
        </svg>
      </Match>
      <Match when={props.t === SETTING}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={cn(
            props.hidden && 'opacity-70',
            'fill-current sm:size-12 md:size-20 lg:size-28 xl:size-40',
          )}
          viewBox="0 0 512 512"
        >
          <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
        </svg>
      </Match>
      <Match when={props.t === BACKWARD}>
        <svg
          viewBox="0 0 24 24"
          class={cn(
            props.hidden && 'opacity-70',
            'fill-current sm:size-12 md:size-20 lg:size-28 xl:size-40',
          )}
        >
          <path d="M22 4h-8l-2-2H6c-1.1 0-1.99.9-1.99 2L4 16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2ZM2 6H0v5h.01L0 20c0 1.1.9 2 2 2h18v-2H2V6Z" />
        </svg>
      </Match>
    </Switch>
  );
}

export default Icon;
