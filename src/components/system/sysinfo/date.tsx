import { createDateNow } from '@solid-primitives/date';
import BaseInformation from '@/components/system/sysinfo/base';

const MONTHS = [
	'JAN',
	'FEB',
	'MAR',
	'APR',
	'MAY',
	'JUN',
	'JUL',
	'AUG',
	'SEP',
	'OCT',
	'NOV',
	'DEC',
] as const;

function getMonthExpression(month: number): string {
	return MONTHS[month] ?? '';
}

function DateSection() {
	const [date] = createDateNow(60000);

	return (
		<BaseInformation
			header={`${date().getFullYear()}`}
			value={
				<>{`${getMonthExpression(date().getMonth())} ${date().getDate()}`}</>
			}
		/>
	);
}

export default DateSection;
