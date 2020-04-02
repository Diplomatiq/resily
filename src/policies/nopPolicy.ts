import { ExecutedFn } from '../types/executedFn';
import { Policy } from './policy';

export class NopPolicy<ResultType> extends Policy<ResultType> {
    protected async policyExecutorImpl(fn: ExecutedFn<ResultType>): Promise<ResultType> {
        return fn();
    }
}
