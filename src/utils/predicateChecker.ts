import { Predicate } from '../types/predicate';

export class PredicateChecker {
    public static async single<T>(subject: T, predicate: Predicate<T>): Promise<boolean> {
        return predicate(subject);
    }

    public static async some<T>(subject: T, predicates: Array<Predicate<T>>): Promise<boolean> {
        if (predicates.length === 0) {
            return false;
        }

        for (const predicate of predicates) {
            const positive = await predicate(subject);
            if (positive) {
                return true;
            }
        }

        return false;
    }

    public static async every<T>(subject: T, predicates: Array<Predicate<T>>): Promise<boolean> {
        if (predicates.length === 0) {
            return false;
        }

        for (const predicate of predicates) {
            const positive = await predicate(subject);
            if (!positive) {
                return false;
            }
        }

        return true;
    }
}
