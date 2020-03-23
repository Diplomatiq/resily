import { SuccessDeferred } from '../../../utils/successDeferred';
import { ProactivePolicy } from '../proactivePolicy';
import { BulkheadCompartmentRejectedException } from './bulkheadCompartmentRejectedException';

export class BulkheadIsolationPolicy<ResultType> extends ProactivePolicy<ResultType> {
    private bulkheadCompartmentSize = Number.POSITIVE_INFINITY;
    private queueSize = 0;

    private bulkheadCompartmentUsage = 0;
    private readonly queue: Array<SuccessDeferred<void>> = [];

    public maxConcurrency(bulkheadCompartmentSize: number): void {
        if (!Number.isInteger(bulkheadCompartmentSize)) {
            throw new Error('bulkheadCompartmentSize must be integer');
        }

        if (bulkheadCompartmentSize <= 0) {
            throw new Error('bulkheadCompartmentSize must be greater than 0');
        }

        if (!Number.isSafeInteger(bulkheadCompartmentSize)) {
            throw new Error('bulkheadCompartmentSize must be less than or equal to 2^53 - 1');
        }

        this.throwForPolicyModificationIfExecuting();

        this.bulkheadCompartmentSize = bulkheadCompartmentSize;
    }

    public maxQueuedActions(queueSize: number): void {
        if (!Number.isInteger(queueSize)) {
            throw new Error('queueSize must be integer');
        }

        if (queueSize < 0) {
            throw new Error('queueSize must be greater than or equal to 0');
        }

        if (!Number.isSafeInteger(queueSize)) {
            throw new Error('queueSize must be less than or equal to 2^53 - 1');
        }

        this.throwForPolicyModificationIfExecuting();

        this.queueSize = queueSize;
    }

    public getAvailableSlotsCount(): number {
        return this.bulkheadCompartmentSize - this.bulkheadCompartmentUsage;
    }

    public getAvailableQueuedActionsCount(): number {
        return this.queueSize - this.queue.length;
    }

    protected async policyExecutorImpl(fn: () => ResultType | Promise<ResultType>): Promise<ResultType> {
        if (this.bulkheadCompartmentUsage >= this.bulkheadCompartmentSize) {
            if (this.queue.length >= this.queueSize) {
                throw new BulkheadCompartmentRejectedException();
            }

            const queuingDeferred = new SuccessDeferred<void>();
            this.queue.push(queuingDeferred);
            await queuingDeferred.promise;
        }

        try {
            this.bulkheadCompartmentUsage++;
            return await fn();
        } finally {
            this.bulkheadCompartmentUsage--;
            this.queue.shift()?.resolve();
        }
    }
}
