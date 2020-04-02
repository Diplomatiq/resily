import { expect } from 'chai';
import { PolicyCombination } from '../../src/policies/policyCombination';
import { TimeoutException } from '../../src/policies/proactive/timeoutPolicy/timeoutException';
import { TimeoutPolicy } from '../../src/policies/proactive/timeoutPolicy/timeoutPolicy';
import { FallbackPolicy } from '../../src/policies/reactive/fallbackPolicy/fallbackPolicy';
import { RetryPolicy } from '../../src/policies/reactive/retryPolicy/retryPolicy';

describe('PolicyCombination', (): void => {
    it('should run the wrapped policy inside the wrapper policy (wrapped with singular wrapping)', async (): Promise<
        void
    > => {
        let onRetryExecuted = 0;
        let onFallbackExecuted = 0;

        const fallbackPolicy = new FallbackPolicy<boolean>();
        fallbackPolicy.reactOnResult((r): boolean => r);
        fallbackPolicy.fallback((): boolean => {
            return false;
        });
        fallbackPolicy.onFallback((): void => {
            expect(onRetryExecuted).to.equal(1);
            onFallbackExecuted++;
        });

        const retryPolicy = new RetryPolicy<boolean>();
        retryPolicy.reactOnResult((r): boolean => r);
        retryPolicy.onRetry((): void => {
            expect(onFallbackExecuted).to.equal(0);
            onRetryExecuted++;
        });

        fallbackPolicy.wrap(retryPolicy);

        await fallbackPolicy.execute((): boolean => {
            return true;
        });

        expect(onRetryExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });

    it('should run the wrapped policy inside the wrapper policy (combined with PolicyCombination)', async (): Promise<
        void
    > => {
        let onRetryExecuted = 0;
        let onFallbackExecuted = 0;

        const fallbackPolicy = new FallbackPolicy<boolean>();
        fallbackPolicy.reactOnResult((r): boolean => r);
        fallbackPolicy.fallback((): boolean => {
            return false;
        });
        fallbackPolicy.onFallback((): void => {
            expect(onRetryExecuted).to.equal(1);
            onFallbackExecuted++;
        });

        const retryPolicy = new RetryPolicy<boolean>();
        retryPolicy.reactOnResult((r): boolean => r);
        retryPolicy.onRetry((): void => {
            expect(onFallbackExecuted).to.equal(0);
            onRetryExecuted++;
        });

        const wrappedPolicy = PolicyCombination.combine<boolean>([fallbackPolicy, retryPolicy]);
        await wrappedPolicy.execute((): boolean => {
            return true;
        });

        expect(onRetryExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });

    it('should construct a policy which combines the other policies sequentially', async (): Promise<void> => {
        let onTimeoutExecuted = 0;
        let onRetryExecuted = 0;
        let onFallbackExecuted = 0;

        const fallbackPolicy = new FallbackPolicy<void>();
        fallbackPolicy.reactOnException((e): boolean => e instanceof TimeoutException);
        fallbackPolicy.fallback((): void => {
            // empty
        });
        fallbackPolicy.onFallback((): void => {
            expect(onTimeoutExecuted).to.equal(1);
            expect(onRetryExecuted).to.equal(1);
            expect(onFallbackExecuted).to.equal(0);
            onFallbackExecuted++;
        });

        const retryPolicy = new RetryPolicy<void>();
        retryPolicy.reactOnException((e): boolean => e instanceof TimeoutException);
        retryPolicy.onRetry((): void => {
            expect(onTimeoutExecuted).to.equal(1);
            expect(onRetryExecuted).to.equal(0);
            expect(onFallbackExecuted).to.equal(0);
            onRetryExecuted++;
        });

        const timeoutPolicy = new TimeoutPolicy<void>();
        timeoutPolicy.timeoutAfter(1);
        timeoutPolicy.onTimeout((): void => {
            expect(onTimeoutExecuted).to.equal(0);
            expect(onRetryExecuted).to.equal(0);
            expect(onFallbackExecuted).to.equal(0);
            onTimeoutExecuted++;
        });

        const wrappedPolicies = PolicyCombination.combine<void>([fallbackPolicy, retryPolicy, timeoutPolicy]);
        await wrappedPolicies.execute(
            async (): Promise<void> => {
                return new Promise((resolve): void => {
                    setTimeout(resolve, 5);
                });
            },
        );

        expect(onTimeoutExecuted).to.equal(1);
        expect(onRetryExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });
});
