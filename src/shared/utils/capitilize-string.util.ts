export function capitalizeString(input: any): string {
  if (!input) return;
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
