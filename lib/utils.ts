export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDistance(km: number): string {
  const miles = km * 0.621371;
  return miles >= 1 ? `${miles.toFixed(0)} mi` : `${(miles * 5280).toFixed(0)} ft`;
}

export function formatElevation(meters: number): string {
  const feet = meters * 3.28084;
  return `${feet.toLocaleString('en-US', { maximumFractionDigits: 0 })} ft`;
}

export function formatRaceDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function isRacePast(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

export function platformFee(amountCents: number): number {
  return Math.floor(amountCents * 0.05);
}

export function providerPayout(amountCents: number): number {
  return amountCents - platformFee(amountCents);
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}
