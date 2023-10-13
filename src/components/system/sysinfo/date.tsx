import BaseInformation from '@/components/system/sysinfo/base';
import { useEffect, useState } from 'react';

function DateSection() {
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    // Update localTime every second
    const intervalId = setInterval(() => {
      const newDate = new Date();
      setDate(prev => {
        if (prev.getDate() !== newDate.getDate()) {
          return newDate;
        } else {
          return prev;
        }
      });
    }, 1000);

    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  function getMonthExpression(month: number): string {
    switch (month) {
      case 0:
        return 'JAN';
      case 1:
        return 'FEB';
      case 2:
        return 'MAR';
      case 3:
        return 'APR';
      case 4:
        return 'MAY';
      case 5:
        return 'JUN';
      case 6:
        return 'JUL';
      case 7:
        return 'AUG';
      case 8:
        return 'SEP';
      case 9:
        return 'OCT';
      case 10:
        return 'NOV';
      case 11:
        return 'DEC';
      default:
        return '';
    }
  }

  return (
    <BaseInformation
      header={date.getFullYear() + '' || ''}
      value={getMonthExpression(date.getMonth()) + ' ' + date.getDate()}
    />
  );
}

export default DateSection;
