import { OnFinallyFn } from '../../../types/onFinallyFn';
import { ReactivePolicy } from '../reactivePolicy';
import { BackoffStrategy } from './backoffStrategy';
import { OnRetryFn } from './onRetryFn';

export class RetryPolicy<ResultType> extends ReactivePolicy<ResultType> {
    private totalRetryCount = 1;
    private readonly onRetryFns: Array<OnRetryFn<ResultType>> = [];
    private readonly onFinallyFns: OnFinallyFn[] = [];

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

        this.throwForPolicyModificationIfExecuting();

        this.totalRetryCount = retryCount;
    }

    public retryForever(): void {
        this.throwForPolicyModificationIfExecuting();

        this.totalRetryCount = Number.POSITIVE_INFINITY;
    }

    public onRetry(fn: OnRetryFn<ResultType>): void {
        this.throwForPolicyModificationIfExecuting();

        this.onRetryFns.push(fn);
    }

    public waitBeforeRetry(strategy: BackoffStrategy): void {
        this.throwForPolicyModificationIfExecuting();

        this.backoffStrategy = strategy;
    }

    public onFinally(fn: OnFinallyFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onFinallyFns.push(fn);
    }

    protected async policyExecutorImpl(fn: () => ResultType | Promise<ResultType>): Promise<ResultType> {
        try {
            let currentRetryCount = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const result = await fn();

                    const shouldRetryOnResult = await this.isReactiveToResult(result);
                    if (!shouldRetryOnResult) {
                        return result;
                    }

                    currentRetryCount++;
                    if (!this.hasRetryLeft(currentRetryCount)) {
                        return result;
                    }

                    const waitFor = await this.backoffStrategy(currentRetryCount);
                    if (waitFor > 0) {
                        await this.waitFor(waitFor);
                    }

                    for (const onRetryFn of this.onRetryFns) {
                        try {
                            await onRetryFn(result, undefined, currentRetryCount);
                        } catch (onRetryError) {
                            // ignored
                        }
                    }

                    continue;
                } catch (ex) {
                    const shouldRetryOnException = await this.isReactiveToException(ex);
                    if (!shouldRetryOnException) {
                        throw ex;
                    }

                    currentRetryCount++;
                    if (!this.hasRetryLeft(currentRetryCount)) {
                        throw ex;
                    }

                    const waitFor = await this.backoffStrategy(currentRetryCount);
                    if (waitFor > 0) {
                        await this.waitFor(waitFor);
                    }

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
            for (const onFinallyFn of this.onFinallyFns) {
                try {
                    await onFinallyFn();
                } catch (onFinallyError) {
                    // ignored
                }
            }
        }
    }

    private backoffStrategy: BackoffStrategy = (): number => 0;

    private hasRetryLeft(currentRetryCount: number): boolean {
        return currentRetryCount <= this.totalRetryCount;
    }

    private async waitFor(ms: number): Promise<void> {
        return new Promise((resolve): void => {
            setTimeout(resolve, ms);
        });
    }
}
