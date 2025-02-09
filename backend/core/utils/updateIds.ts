/**
 * updateIds
 *
 * This function accepts a JSON string as input. It parses the JSON,
 * recursively finds all id values (i.e. for keys "id" or keys ending with "Id"),
 * and creates a mapping from each old id to a new UUID.
 * Then it replaces all occurrences of each old id (even within longer strings)
 * with the new id.
 *
 * @param jsonString - The input JSON as a string.
 * @returns A JSON string with the updated ids.
 */
export function updateIds(obj: Record<string, any>) {
  // Mapping from old id string to new UUID.
  const idMapping: Record<string, string> = {};

  /**
   * Recursively walk the object to collect ids.
   * We consider a property to be an id if its key is "id" or ends with "Id" (case insensitive).
   */
  function collectIds(node: any): void {
    if (Array.isArray(node)) {
      node.forEach(collectIds);
    } else if (node !== null && typeof node === "object") {
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          const value = node[key];
          // Check keys that are exactly "id" or end with "Id" (case insensitive).
          if (
            (key === "id" || key.toLowerCase().endsWith("id")) &&
            typeof value === "string"
          ) {
            if (!idMapping[value]) {
              idMapping[value] = crypto.randomUUID();
            }
          }
          // Continue to traverse the value.
          collectIds(value);
        }
      }
    }
  }
  collectIds(obj);

  /**
   * Recursively walk the object and replace every occurrence of any old id (in objects and strings)
   * with its new id.
   */
  function replaceIds(node: any): any {
    if (Array.isArray(node)) {
      return node.map(replaceIds);
    } else if (node !== null && typeof node === "object") {
      const newNode: any = {};
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          newNode[key] = replaceIds(node[key]);
        }
      }
      return newNode;
    } else if (typeof node === "string") {
      let updatedString = node;
      // Replace all occurrences of old IDs in strings.
      for (const oldId in idMapping) {
        if (Object.prototype.hasOwnProperty.call(idMapping, oldId)) {
          const newId = idMapping[oldId];
          // Escape the old id so it can be used in a regex.
          const escapedOldId = oldId.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
          updatedString = updatedString.replace(
            new RegExp(escapedOldId, "g"),
            newId
          );
        }
      }
      return updatedString;
    }
    return node;
  }

  // Get the updated object.
  const updatedObj = replaceIds(obj);

  return updatedObj;
}
