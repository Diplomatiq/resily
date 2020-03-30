import { ExecutedFn } from '../../../types/executedFn';
import { ProactivePolicy } from '../proactivePolicy';

export class NopPolicy<ResultType> extends ProactivePolicy<ResultType> {
    protected async policyExecutorImpl(fn: ExecutedFn<ResultType>): Promise<ResultType> {
        return fn();
    }
}
