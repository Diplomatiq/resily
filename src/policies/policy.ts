import { ExecutedFn } from '../types/executedFn';
import { PolicyModificationNotAllowedException } from '../types/policyModificationNotAllowedException';

export abstract class Policy<ResultType> {
    private executing = 0;

    public async execute(fn: ExecutedFn<ResultType>): Promise<ResultType> {
        try {
            this.executing++;
            return await this.policyExecutorImpl(fn);
        } finally {
            this.executing--;
        }
    }

    public isExecuting(): boolean {
        return this.executing > 0;
    }

    protected throwForPolicyModificationIfExecuting(): void {
        if (this.isExecuting()) {
            throw new PolicyModificationNotAllowedException();
        }
    }

    protected abstract async policyExecutorImpl(fn: ExecutedFn<ResultType>): Promise<ResultType>;
}
