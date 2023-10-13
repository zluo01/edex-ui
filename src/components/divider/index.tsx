import classNames from '@/lib/utils/style';
import ThemeContext from '@/themes/provider';
import { useContext } from 'react';

function Divider() {
  const theme = useContext(ThemeContext);

  return (
    <div
      className={classNames(
        theme.borderColor['30'],
        'flex justify-between w-full h-0 pt-[0.645vh] px-0 border-solid border-t-[0.092vh]',
        'before:content-[""] before:relative before:left-[-0.092vh] before:-top-[1.111vh] before:h-[0.833vh] before:border-solid before:border-l-[0.092vh] before:border-[inherit]',
        'after:content-[""] after:relative after:right-[-0.092vh] after:-top-[1.111vh] after:h-[0.833vh] after:border-solid after:border-r-[0.092vh] after:border-[inherit]',
      )}
    />
  );
}

export default Divider;
