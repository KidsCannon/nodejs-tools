export class StopWatch {
  private _start = 0
  private _stop = 0

  start(): void {
    this._start = StopWatch.getMilliseconds()
  }

  end(): void {
    this._stop = StopWatch.getMilliseconds()
  }

  getTotal(): number {
    return this._stop - this._start
  }

  private static getMilliseconds() {
    return Date.now()
  }
}
