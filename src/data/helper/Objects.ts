const Objects = {
  deepEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (
      typeof a !== 'object' ||
      typeof b !== 'object' ||
      a === null ||
      b === null
    ) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      const valueA = a[key];
      const valueB = b[key];

      if (!this.deepEqual(valueA, valueB)) {
        return false;
      }
    }

    return true;
  }
};

export default Objects;
