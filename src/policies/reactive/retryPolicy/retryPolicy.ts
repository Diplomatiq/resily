import { OnFinallyFn } from '../../../types/onFinallyFn';
import { ReactivePolicy } from '../reactivePolicy';
import { BackoffStrategy } from './backoffStrategy';
import { OnRetryFn } from './onRetryFn';

export class RetryPolicy<ResultType> extends ReactivePolicy<ResultType> {
    private totalRetryCount = 1;
    private readonly onRetryFns: Array<OnRetryFn<ResultType>> = [];
    private backoffStrategy: BackoffStrategy = (): number => 0;
    private readonly onFinallyFns: OnFinallyFn[] = [];
    private executing = 0;

    public constructor() {
        super();
    }

    public retryCount(retryCount: number): void {
        if (!Number.isInteger(retryCount)) {
            throw new Error('retryCount must be integer');
        }

        if (retryCount <= 0) {
            throw new Error('retryCount must be greater than 0');
        }

        if (!Number.isSafeInteger(retryCount)) {
            throw new Error('retryCount must be less than or equal to 2^53 - 1');
        }

        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.totalRetryCount = retryCount;
    }

    public retryForever(): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.totalRetryCount = Number.POSITIVE_INFINITY;
    }

    public onRetry(fn: OnRetryFn<ResultType>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onRetryFns.push(fn);
    }

    public waitBeforeRetry(strategy: BackoffStrategy): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.backoffStrategy = strategy;
    }

    public onFinally(fn: OnFinallyFn): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onFinallyFns.push(fn);
    }

    public async execute(fn: () => ResultType | Promise<ResultType>): Promise<ResultType> {
        try {
            this.executing++;

            let currentRetryCount = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const result = await fn();

                    const shouldRetryOnResult = await this.isResultHandled(result);
                    if (!shouldRetryOnResult) {
                        return result;
                    }

                    currentRetryCount++;
                    if (!this.hasRetryLeft(currentRetryCount)) {
                        return result;
                    }

                    const waitFor = await this.backoffStrategy(currentRetryCount);
                    await this.waitFor(waitFor);

                    for (const onRetryFn of this.onRetryFns) {
                        try {
                            await onRetryFn(result, undefined, currentRetryCount);
                        } catch (onRetryError) {
                            // ignored
                        }
                    }

                    continue;
                } catch (ex) {
                    const shouldRetryOnException = await this.isExceptionHandled(ex);
                    if (!shouldRetryOnException) {
                        throw ex;
                    }

                    currentRetryCount++;
                    if (!this.hasRetryLeft(currentRetryCount)) {
                        throw ex;
                    }

                    const waitFor = await this.backoffStrategy(currentRetryCount);
                    await this.waitFor(waitFor);

                    for (const onRetryFn of this.onRetryFns) {
                        try {
                            await onRetryFn(undefined, ex, currentRetryCount);
                        } catch (onRetryError) {
                            // ignored
                        }
                    }

                    continue;
                }
            }
        } finally {
            try {
                for (const onFinallyFn of this.onFinallyFns) {
                    try {
                        await onFinallyFn();
                    } catch (onFinallyError) {
                        // ignored
                    }
                }
            } finally {
                this.executing--;
            }
        }
    }

    private hasRetryLeft(currentRetryCount: number): boolean {
        return currentRetryCount <= this.totalRetryCount;
    }

    private async waitFor(ms: number): Promise<void> {
        return new Promise((resolve): void => {
            setTimeout(resolve, ms);
        });
    }
}
