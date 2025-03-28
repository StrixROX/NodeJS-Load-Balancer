/**
 * @description
 * Assert that a condition is true. If the condition is false, throw an error.
 *
 * @example
 * const myVar = 5;
 * appAssert(myVar === 5, 'myVar is 5', 'myVar should be 5');
 *
 * @param condition - The condition being asserted.
 * @param title - The title of the error that will be thrown.
 * @param message - The message of the error that will be thrown.
 * @returns - If the condition is true, this function will return undefined.
 */
function appAssert(condition: boolean, title: string, message: string): void {
  if (!condition) {
    throw new Error(`${title}: ${message}`);
  }
}

export default appAssert;
