export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureAt = 0;
  private halfOpenCalls = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getSnapshot() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureAt: this.lastFailureAt,
      halfOpenCalls: this.halfOpenCalls,
      options: this.options,
    };
  }

  canRequest(now = Date.now()): boolean {
    if (this.state === 'OPEN') {
      if (now - this.lastFailureAt >= this.options.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
        return true;
      }
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.options.halfOpenMaxCalls;
    }

    return true;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureAt = 0;
    this.state = 'CLOSED';
    this.halfOpenCalls = 0;
  }

  recordFailure(now = Date.now()) {
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.lastFailureAt = now;
      this.failureCount = this.options.failureThreshold;
      return;
    }

    this.failureCount += 1;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
      this.lastFailureAt = now;
    }
  }

  onHalfOpenCall() {
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls += 1;
    }
  }
}
