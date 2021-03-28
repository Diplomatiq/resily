import { ExecutedFn } from '../types/executedFn';
import { PolicyModificationNotAllowedException } from '../types/policyModificationNotAllowedException';

export abstract class Policy<ResultType> {
    private executing = 0;
    private wrappedPolicy?: Policy<ResultType>;

    public async execute(fn: ExecutedFn<ResultType>): Promise<ResultType> {
        try {
            this.executing++;

            return await this.policyExecutorImpl(
                async (): Promise<ResultType> => {
                    if (this.wrappedPolicy !== undefined) {
                        return this.wrappedPolicy.execute(fn);
                    }

                    return fn();
                },
            );
        } finally {
            this.executing--;
        }
    }

    public isExecuting(): boolean {
        return this.executing > 0;
    }

    public wrap(policy: Policy<ResultType>): void {
        this.throwForPolicyModificationIfExecuting();

        this.wrappedPolicy = policy;
    }

    protected throwForPolicyModificationIfExecuting(): void {
        if (this.isExecuting()) {
            throw new PolicyModificationNotAllowedException();
        }
    }

    protected abstract policyExecutorImpl(fn: ExecutedFn<ResultType>): Promise<ResultType>;
}
