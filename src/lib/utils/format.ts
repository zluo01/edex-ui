export default function formatTime(num: number): string {
  if (num < 10) {
    return '0' + num.toString();
  } else {
    return num.toString();
  }
}
