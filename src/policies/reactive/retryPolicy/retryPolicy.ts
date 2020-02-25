import { Predicate } from '../../../types/predicate';
import { ReactivePolicy } from '../reactivePolicy';

export class RetryPolicy<ResultType> extends ReactivePolicy<ResultType> {
    private totalRetryCount = 1;
    private readonly onRetryFns: Array<
        (result: ResultType | undefined, error: unknown | undefined, currentRetryCount: number) => void | Promise<void>
    > = [];
    private backoffStrategy: (currentRetryCount: number) => number | Promise<number> = (): number => 0;
    private readonly onFinallyFns: Array<() => void | Promise<void>> = [];
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

    public onRetry(
        fn: (
            result: ResultType | undefined,
            error: unknown | undefined,
            currentRetryCount: number,
        ) => void | Promise<void>,
    ): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onRetryFns.push(fn);
    }

    public waitBeforeRetry(strategy: (currentRetryCount: number) => number | Promise<number>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.backoffStrategy = strategy;
    }

    public onFinally(fn: () => void | Promise<void>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onFinallyFns.push(fn);
    }

    public async execute(fn: () => ResultType | Promise<ResultType>): Promise<ResultType> {
        this.executing++;

        try {
            let currentRetryCount = 0;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const result = await fn();

                    currentRetryCount++;
                    const shouldRetry = await this.shouldRetryOnResult(result, currentRetryCount);
                    if (!shouldRetry) {
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
                    currentRetryCount++;
                    const shouldRetry = await this.shouldRetryOnException(ex, currentRetryCount);
                    if (!shouldRetry) {
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

    private async shouldRetryOnResult(result: ResultType, currentRetryCount: number): Promise<boolean> {
        return this.shouldRetryOn(
            currentRetryCount,
            result,
            async (result): Promise<boolean> => this.isResultHandled(result),
        );
    }

    private async shouldRetryOnException(exception: unknown, currentRetryCount: number): Promise<boolean> {
        return this.shouldRetryOn(
            currentRetryCount,
            exception,
            async (exception): Promise<boolean> => this.isExceptionHandled(exception),
        );
    }

    private async shouldRetryOn<T>(
        currentRetryCount: number,
        subject: T,
        shouldRetryCb: Predicate<T>,
    ): Promise<boolean> {
        if (currentRetryCount > this.totalRetryCount) {
            return false;
        }

        return shouldRetryCb(subject);
    }

    private async waitFor(ms: number): Promise<void> {
        return new Promise((resolve): void => {
            setTimeout(resolve, ms);
        });
    }
}
