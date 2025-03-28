import appAssert from '../appAssert';

describe('appAssert', () => {
  it('throws an error if the condition is false', () => {
    expect(() => appAssert(false, 'test', 'test')).toThrow("test: test");
  });

  it('does not throw an error if the condition is true', () => {
    expect(() => appAssert(true, 'test', 'test')).not.toThrow();
  });
});
