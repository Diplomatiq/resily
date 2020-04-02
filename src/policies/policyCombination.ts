import { Policy } from './policy';

export class PolicyCombination {
    public static combine<ResultType>(
        policies: [Policy<ResultType>, Policy<ResultType>, ...Array<Policy<ResultType>>],
    ): Policy<ResultType> {
        return policies.reduceRight(
            (prev, next): Policy<ResultType> => {
                next.wrap(prev);
                return next;
            },
        );
    }
}
