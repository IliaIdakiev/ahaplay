export function withCancel<T>(
  asyncIterator: AsyncIterator<T | undefined>,
  onCancel: Function
): AsyncIterator<T | undefined> {
  let originalReturn = asyncIterator.return;

  asyncIterator.return = () => {
    onCancel();
    return originalReturn
      ? originalReturn.call(asyncIterator)
      : Promise.resolve({ value: undefined, done: true });
  };

  return asyncIterator;
}
