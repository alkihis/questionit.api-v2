
export function getEnumValues<T>(enumeration: T, isNumeric: false): string[];
export function getEnumValues<T>(enumeration: T, isNumeric: true): number[];
export function getEnumValues<T>(enumeration: T, isNumeric: boolean): any[] {
  const values = Object.values(enumeration);
  const correctItems: any[] = [];

  for (const val of values) {
    if (isNumeric) {
      if (typeof val === 'number') {
        correctItems.push(val);
      }
    } else {
      correctItems.push(val);
    }
  }

  return correctItems;
}
