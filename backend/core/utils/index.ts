export const getNestedValue = (object: any, path: string): any => {
  return path
    .split(".")
    .reduce((acc, key) => (acc ? acc[key] : undefined), object);
};
