import { Predicate } from '../../types/predicate';
import { PredicateChecker } from '../../utils/predicateChecker';
import { Policy } from '../policy';

export abstract class ReactivePolicy<ResultType> extends Policy<ResultType> {
    protected resultPredicates: Array<Predicate<ResultType>> = [];
    protected exceptionPredicates: Array<Predicate<unknown>> = [];

    public reactOnResult(resultPredicate: Predicate<ResultType>): void {
        this.resultPredicates.push(resultPredicate);
    }

    public reactOnException(exceptionPredicate: Predicate<unknown>): void {
        this.exceptionPredicates.push(exceptionPredicate);
    }

    protected async isReactiveToResult(result: ResultType): Promise<boolean> {
        return PredicateChecker.some(result, this.resultPredicates);
    }

    protected async isReactiveToException(exception: unknown): Promise<boolean> {
        return PredicateChecker.some(exception, this.exceptionPredicates);
    }
}
