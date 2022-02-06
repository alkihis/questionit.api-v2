
export function getUnaccentQuery(propName: string, searchPropName = 'query') {
  return `unaccent(${propName}) ILIKE unaccent('%' || :${searchPropName} || '%')`;
}
