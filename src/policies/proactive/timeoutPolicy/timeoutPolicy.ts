import { ProactivePolicy } from '../proactivePolicy';
import { ExecutionException } from './executionException';
import { OnTimeoutFn } from './onTimeoutFn';
import { TimeoutException } from './timeoutException';

export class TimeoutPolicy<ResultType> extends ProactivePolicy<ResultType> {
    private timeoutMs: number | undefined;
    private readonly onTimeoutFns: OnTimeoutFn[] = [];

    private executing = 0;

    public timeoutAfter(timeoutMs: number): void {
        if (!Number.isInteger(timeoutMs)) {
            throw new Error('timeoutMs must be integer');
        }

        if (timeoutMs <= 0) {
            throw new Error('timeoutMs must be greater than 0');
        }

        if (!Number.isSafeInteger(timeoutMs)) {
            throw new Error('timeoutMs must be less than or equal to 2^53 - 1');
        }

        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.timeoutMs = timeoutMs;
    }

    public onTimeout(fn: (timedOutAfterMs: number) => void | Promise<void>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onTimeoutFns.push(fn);
    }

    public async execute(fn: () => Promise<ResultType>): Promise<ResultType> {
        this.executing++;

        const executionPromise = (async (): Promise<ResultType> => {
            try {
                return await fn();
            } catch (ex) {
                throw new ExecutionException(ex);
            }
        })();

        let timeoutId;
        const timeoutPromise = new Promise<never>((_, reject): void => {
            if (this.timeoutMs !== undefined) {
                const currentTimeoutMs = this.timeoutMs;
                timeoutId = setTimeout((): void => {
                    reject(new TimeoutException(currentTimeoutMs));
                }, this.timeoutMs);
            }
        });

        try {
            return await Promise.race([executionPromise, timeoutPromise]);
        } catch (ex) {
            const typedEx: ExecutionException | TimeoutException = ex;
            if (typedEx instanceof TimeoutException) {
                for (const onTimeoutFn of this.onTimeoutFns) {
                    try {
                        await onTimeoutFn(typedEx.timedOutAfterMs);
                    } catch (onTimeoutError) {
                        // ignored
                    }
                }

                throw typedEx;
            }

            throw typedEx.innerException;
        } finally {
            clearTimeout(timeoutId);
            this.executing--;
        }
    }
}
