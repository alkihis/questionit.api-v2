
export function cleanBlankCharacters(string: string) {
  return string.replace(/\s+/g, ' ').trim();
}
