import { ProactivePolicy } from '../proactivePolicy';
import { ExecutionException } from './executionException';
import { OnTimeoutFn } from './onTimeoutFn';
import { TimeoutException } from './timeoutException';

export class TimeoutPolicy<ResultType> extends ProactivePolicy<ResultType> {
    private timeoutMs: number | undefined;
    private readonly onTimeoutFns: OnTimeoutFn[] = [];

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

        this.throwForPolicyModificationIfExecuting();

        this.timeoutMs = timeoutMs;
    }

    public onTimeout(fn: (timedOutAfterMs: number) => void | Promise<void>): void {
        this.throwForPolicyModificationIfExecuting();

        this.onTimeoutFns.push(fn);
    }

    protected async policyExecutorImpl(fn: () => Promise<ResultType>): Promise<ResultType> {
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
        }
    }
}
