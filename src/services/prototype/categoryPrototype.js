export function categoryPrototype(body) {
  const { name, iconName } = body;

  let object = {
    name,
    iconName,
  };
  return object;
}
