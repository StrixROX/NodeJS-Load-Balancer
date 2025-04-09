import errorBoundary from '../errorBoundary';

describe('errorBoundary', () => {
  it('does not throw an error if the function does not throw an error', () => {
    const fn = jest.fn(() => {});
    const wrappedFn = errorBoundary(fn);
    wrappedFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('console logs the error if the function throws an error', () => {
    const consoleError = jest.spyOn(console, 'error');
    consoleError.mockImplementation(() => {});

    const fn = jest.fn(() => {
      throw new Error('test');
    });
    const wrappedFn = errorBoundary(fn);
    wrappedFn();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(new Error('test'));
  });
});
