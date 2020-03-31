import { ExecutedFn } from '../../../types/executedFn';
import { ProactivePolicy } from '../proactivePolicy';
import { OnCacheGetFn } from './onCacheGetFn';
import { OnCacheMissFn } from './onCacheMissFn';
import { OnCachePutFn } from './onCachePutFn';
import { TimeToLiveStrategy } from './timeToLiveStrategy';

export class CachePolicy<ResultType> extends ProactivePolicy<ResultType> {
    private timeToLiveStrategy: TimeToLiveStrategy = 'relative';
    private timeToLiveValue = 1000;
    private readonly onCacheGetFns: OnCacheGetFn[] = [];
    private readonly onCachePutFns: OnCachePutFn[] = [];
    private readonly onCacheMissFns: OnCacheMissFn[] = [];

    private cache!: ResultType;
    private validUntil = -1;

    public timeToLive(strategy: TimeToLiveStrategy, value: number): void {
        if (!Number.isInteger(value)) {
            throw new Error('value must be integer');
        }

        if (value <= 0) {
            throw new Error('value must be greater than 0');
        }

        if (!Number.isSafeInteger(value)) {
            throw new Error('value must be less than or equal to 2^53 - 1');
        }

        this.throwForPolicyModificationIfExecuting();

        this.timeToLiveStrategy = strategy;
        this.timeToLiveValue = value;
    }

    public onCacheGet(fn: OnCacheGetFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onCacheGetFns.push(fn);
    }

    public onCachePut(fn: OnCachePutFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onCachePutFns.push(fn);
    }

    public onCacheMiss(fn: OnCacheMissFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onCacheMissFns.push(fn);
    }

    public invalidate(): void {
        this.resetValidity(true);
    }

    protected async policyExecutorImpl(fn: ExecutedFn<ResultType>): Promise<ResultType> {
        if (this.isInvalid()) {
            for (const onCacheMissFn of this.onCacheMissFns) {
                try {
                    await onCacheMissFn();
                } catch (onCacheMissError) {
                    // ignore
                }
            }

            await this.updateCache(fn);

            for (const onCachePutFn of this.onCachePutFns) {
                try {
                    await onCachePutFn();
                } catch (onCachePutError) {
                    // ignore
                }
            }
        } else {
            for (const onCacheGetFn of this.onCacheGetFns) {
                try {
                    await onCacheGetFn();
                } catch (onCacheGetError) {
                    // ignore
                }
            }
        }

        return this.cache;
    }

    private async updateCache(fn: ExecutedFn<ResultType>): Promise<void> {
        this.cache = await fn();
        this.resetValidity(false);
    }

    private isInvalid(): boolean {
        if (this.cache === undefined || Date.now() >= this.validUntil) {
            return true;
        }

        if (this.timeToLiveStrategy === 'sliding') {
            this.resetValidity(false);
        }

        return false;
    }

    private resetValidity(invalidate: boolean): void {
        if (invalidate) {
            this.validUntil = -1;
        } else {
            switch (this.timeToLiveStrategy) {
                case 'relative':
                case 'sliding':
                    this.validUntil = Date.now() + this.timeToLiveValue;
                    break;

                case 'absolute':
                    this.validUntil = this.timeToLiveValue;
                    break;
            }
        }
    }
}
