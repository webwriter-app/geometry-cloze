const Arrays = {
  /**
   * Get element at position
   * Index loops around if larger than length or smaller than zero
   */
  at<T extends any[] | readonly any[]>(
    array: T,
    index: number
  ): T[number] | undefined {
    index %= array.length;
    index += array.length;
    index %= array.length;
    return array[index];
  }
};

export default Arrays;
