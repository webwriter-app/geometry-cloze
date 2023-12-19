export default class Debouncer {
  private lastCall: number = 0;
  private timeout: number | null = null;

  constructor(
    private callback: () => void,
    private delay: number,
    private maxTimeout = 1000
  ) {}

  public call() {
    if (this.timeout) clearTimeout(this.timeout);

    const now = performance.now();
    if (now - this.lastCall > this.maxTimeout) {
      this.callback();
      this.lastCall = now;
      return;
    }

    this.timeout = setTimeout(() => {
      this.callback();
      this.lastCall = performance.now();
    }, this.delay);
  }
}
