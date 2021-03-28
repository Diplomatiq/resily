import { expect } from 'chai';
import { PolicyCombination } from '../../src/policies/policyCombination';
import { FallbackPolicy } from '../../src/policies/reactive/fallbackPolicy/fallbackPolicy';
import { RetryPolicy } from '../../src/policies/reactive/retryPolicy/retryPolicy';

describe('PolicyCombination', (): void => {
    it('should run the wrapped policy inside the wrapper policy (wrapped with singular wrapping)', async (): Promise<void> => {
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

    it('should run the wrapped policy inside the wrapper policy (combined with PolicyCombination)', async (): Promise<void> => {
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
});
