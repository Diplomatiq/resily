import { Predicate } from '../../types/predicate';
import { PredicateChecker } from '../../utils/predicateChecker';
import { Policy } from '../policy';

export abstract class ReactivePolicy<ResultType> extends Policy<ResultType> {
    protected resultPredicates: Array<Predicate<ResultType>> = [];
    protected exceptionPredicates: Array<Predicate<unknown>> = [];

    public handleResult(resultPredicate: Predicate<ResultType>): void {
        this.resultPredicates.push(resultPredicate);
    }

    public handleException(exceptionPredicate: Predicate<unknown>): void {
        this.exceptionPredicates.push(exceptionPredicate);
    }

    protected async isResultHandled(result: ResultType): Promise<boolean> {
        return PredicateChecker.some(result, this.resultPredicates);
    }

    protected async isExceptionHandled(exception: unknown): Promise<boolean> {
        return PredicateChecker.some(exception, this.exceptionPredicates);
    }
}
