export function compactInPlace<T>(items: T[], keep: (item: T) => boolean) {
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < items.length; readIndex += 1) {
    const item = items[readIndex];
    if (!keep(item)) continue;
    items[writeIndex] = item;
    writeIndex += 1;
  }
  items.length = writeIndex;
  return items;
}

export function removeOldestInPlace<T>(items: T[], count: number) {
  if (count <= 0) return items;
  if (count >= items.length) {
    items.length = 0;
    return items;
  }
  items.copyWithin(0, count);
  items.length -= count;
  return items;
}
