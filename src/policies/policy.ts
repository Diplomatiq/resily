export abstract class Policy<ResultType> {
    public abstract async execute(fn: () => ResultType | Promise<ResultType>): Promise<ResultType>;
}
