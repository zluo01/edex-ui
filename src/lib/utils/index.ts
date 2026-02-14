import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatTime(num: number): string {
	if (num < 10) {
		return `0${num.toString()}`;
	} else {
		return num.toString();
	}
}
