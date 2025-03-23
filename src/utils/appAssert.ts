function appAssert(condition: boolean, title: string, message: string): void {
  if (!condition) {
    throw new Error(`${title}: ${message}`);
  }
}

export default appAssert;
