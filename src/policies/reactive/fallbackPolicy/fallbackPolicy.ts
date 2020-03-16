import { OnFinallyFn } from '../../../types/onFinallyFn';
import { ReactivePolicy } from '../reactivePolicy';
import { FallbackChainExhaustedException } from './fallbackChainExhaustedException';
import { FallbackChainLink } from './fallbackChainLink';
import { OnFallbackFn } from './onFallbackFn';

export class FallbackPolicy<ResultType> extends ReactivePolicy<ResultType> {
    private readonly fallbackChain: Array<FallbackChainLink<ResultType>> = [];
    private readonly onFallbackFns: Array<OnFallbackFn<ResultType>> = [];
    private readonly onFinallyFns: OnFinallyFn[] = [];
    private executing = 0;

    public fallback(fallbackChainLink: FallbackChainLink<ResultType>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.fallbackChain.push(fallbackChainLink);
    }

    public onFallback(onFallbackFn: OnFallbackFn<ResultType>): void {
        if (this.executing > 0) {
            throw new Error('cannot modify policy during execution');
        }

        this.onFallbackFns.push(onFallbackFn);
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

            const remainingFallbackChain = [...this.fallbackChain];
            let executor = fn;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const result = await executor();

                    const shouldFallbackOnResult = await this.isResultHandled(result);
                    if (!shouldFallbackOnResult) {
                        return result;
                    }

                    const nextExecutor = remainingFallbackChain.shift();
                    if (nextExecutor === undefined) {
                        throw new FallbackChainExhaustedException();
                    }

                    executor = nextExecutor;

                    for (const onFallbackFn of this.onFallbackFns) {
                        try {
                            await onFallbackFn(result, undefined);
                        } catch (onFallbackError) {
                            // ignored
                        }
                    }

                    continue;
                } catch (ex) {
                    if (ex instanceof FallbackChainExhaustedException) {
                        throw ex;
                    }

                    const shouldFallbackOnException = await this.isExceptionHandled(ex);
                    if (!shouldFallbackOnException) {
                        throw ex;
                    }

                    const nextExecutor = remainingFallbackChain.shift();
                    if (nextExecutor === undefined) {
                        throw new FallbackChainExhaustedException();
                    }

                    executor = nextExecutor;

                    for (const onFallbackFn of this.onFallbackFns) {
                        try {
                            await onFallbackFn(undefined, ex);
                        } catch (onFallbackError) {
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
}
