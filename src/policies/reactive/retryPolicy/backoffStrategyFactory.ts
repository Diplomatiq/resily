import { RandomGenerator as DefaultRandomGenerator } from '@diplomatiq/crypto-random';
import { RandomGenerator } from '../../../interfaces/randomGenerator';

export class BackoffStrategyFactory {
    public static constantBackoff(delayMs: number, fastFirst = false): (currentRetryCount: number) => number {
        this.validateNumericArgument(delayMs, 'delayMs');

        return fastFirst
            ? (currentRetryCount: number): number => (currentRetryCount === 1 ? 0 : delayMs)
            : (): number => delayMs;
    }

    public static linearBackoff(delayMs: number, fastFirst = false): (currentRetryCount: number) => number {
        this.validateNumericArgument(delayMs, 'delayMs');

        return fastFirst
            ? (currentRetryCount: number): number => delayMs * (currentRetryCount - 1)
            : (currentRetryCount: number): number => delayMs * currentRetryCount;
    }

    public static exponentialBackoff(
        delayMs: number,
        fastFirst = false,
        base = 2,
    ): (currentRetryCount: number) => number {
        this.validateNumericArgument(delayMs, 'delayMs');
        this.validateNumericArgument(base, 'base');

        return fastFirst
            ? (currentRetryCount: number): number =>
                  currentRetryCount === 1 ? 0 : delayMs * base ** (currentRetryCount - 2)
            : (currentRetryCount: number): number => delayMs * base ** (currentRetryCount - 1);
    }

    public static jitteredBackoff(
        minDelayMs: number,
        maxDelayMs: number,
        fastFirst = false,
        randomGenerator: RandomGenerator = new DefaultRandomGenerator(),
    ): (currentRetryCount: number) => Promise<number> {
        this.validateNumericArgument(minDelayMs, 'minDelayMs');
        this.validateNumericArgument(maxDelayMs, 'maxDelayMs');

        if (maxDelayMs <= minDelayMs) {
            throw new Error('maxDelayMs must be greater than minDelayMs');
        }

        return fastFirst
            ? async (currentRetryCount: number): Promise<number> => {
                  if (currentRetryCount === 1) {
                      return 0;
                  }
                  const [ms] = await randomGenerator.integer(minDelayMs, maxDelayMs);
                  return ms;
              }
            : async (): Promise<number> => {
                  const [ms] = await randomGenerator.integer(minDelayMs, maxDelayMs);
                  return ms;
              };
    }

    private static validateNumericArgument(arg: number, name: string): void {
        if (!Number.isInteger(arg)) {
            throw new Error(`${name} must be integer`);
        }

        if (arg <= 0) {
            throw new Error(`${name} must be greater than 0`);
        }

        if (!Number.isSafeInteger(arg)) {
            throw new Error(`${name} must be less than or equal to 2^53 - 1`);
        }
    }
}
