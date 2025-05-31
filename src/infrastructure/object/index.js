export function isObject(field) {
  return field !== null && typeof field === 'object' && !Array.isArray(field);
}
