import ShowHiddenFileSetting from '@/components/setting/hidden';
import ChangeThemeSelection from '@/components/setting/theme';
import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useContext } from 'react';

interface ISettingProps {
  open: boolean;
  close: VoidFunction;
}

export default function Setting({ open, close }: ISettingProps) {
  const theme = useContext(ThemeContext);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 m-auto h-fit max-h-[62vh] min-h-[62vh] w-[38vw] overflow-y-auto">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-500"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-250"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={classNames(
                theme.name,
                'panel flex h-full w-full items-center justify-center text-center font-united_sans_light',
              )}
              augmented-ui="tr-clip bl-clip exe"
            >
              <Dialog.Panel
                className={classNames(
                  theme.backgroundColor.main,
                  'h-full w-full overflow-hidden text-left transition-all sm:p-1 md:p-3 lg:p-5 xl:p-7',
                )}
              >
                <Dialog.Title
                  as="h3"
                  className={classNames(
                    theme.textColor.main,
                    'font-semibold uppercase sm:text-3xl md:text-5xl lg:text-7xl xl:text-9xl',
                  )}
                >
                  Settings
                </Dialog.Title>
                <div className="mt-2 flex flex-col">
                  <ShowHiddenFileSetting />
                  <ChangeThemeSelection />
                </div>
              </Dialog.Panel>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
