function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)
}

function toCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

function transformValue(value: unknown, keyTransform: (k: string) => string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformValue(item, keyTransform))
  }
  if (value !== null && typeof value === 'object') {
    return transformKeys(value as Record<string, unknown>, keyTransform)
  }
  return value
}

function transformKeys(
  obj: Record<string, unknown>,
  keyTransform: (k: string) => string,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    result[keyTransform(key)] = transformValue(obj[key], keyTransform)
  }
  return result
}

export function snakeToCamel<T>(obj: Record<string, unknown>): T {
  return transformKeys(obj, toCamelKey) as T
}

export function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
  return transformKeys(obj, toSnakeKey)
}
