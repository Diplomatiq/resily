import { expect } from 'chai';
import { PredicateChecker } from '../../src/utils/predicateChecker';

describe('PredicateChecker', (): void => {
    describe('single', (): void => {
        it('should return true, when the predicate returns true for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.single(
                'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
            );
            expect(result).to.be.true;
        });

        it('should return false, when the predicate returns false for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.single(
                'Diplomatiq is not cool.',
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
            );
            expect(result).to.be.false;
        });

        it('should return true, when the async predicate returns true for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.single(
                'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
            );
            expect(result).to.be.true;
        });

        it('should return false, when the async predicate returns false for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.single(
                'Diplomatiq is not cool.',
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
            );
            expect(result).to.be.false;
        });
    });

    describe('some', (): void => {
        it('should return true if at least one of the predicates returns true for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.some('Diplomatiq is cool.', [
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is the coolest.',
            ]);
            expect(result).to.be.true;
        });

        it('should return false if none of the predicates returns true for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.some('Diplomatiq is not cool.', [
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is the coolest.',
            ]);
            expect(result).to.be.false;
        });

        it('should return true if at least one of the async predicates returns true for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.some('Diplomatiq is cool.', [
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is the coolest.',
            ]);
            expect(result).to.be.true;
        });

        it('should return false if none of the async predicates returns true for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.some('Diplomatiq is not cool.', [
                (subject: string): boolean => subject === 'Diplomatiq is cool.',
                (subject: string): boolean => subject === 'Diplomatiq is the coolest.',
            ]);
            expect(result).to.be.false;
        });

        it('should return false if predicates is empty', async (): Promise<void> => {
            const result = await PredicateChecker.some('Diplomatiq is cool.', []);
            expect(result).to.be.false;
        });
    });

    describe('all', (): void => {
        it('should return true if all of the predicates returns true for the subject', async (): Promise<void> => {
            const result = await PredicateChecker.every('Diplomatiq is cool.', [
                (subject: string): boolean => subject.includes('Diplomatiq'),
                (subject: string): boolean => subject.includes('cool'),
            ]);
            expect(result).to.be.true;
        });

        it('should return false if at least one of the predicates returns false for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.every('Diplomatiq is cool.', [
                (subject: string): boolean => subject.includes('Diplomatiq'),
                (subject: string): boolean => subject.includes('not cool'),
            ]);
            expect(result).to.be.false;
        });

        it('should return true if all of the async predicates returns true for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.every('Diplomatiq is cool.', [
                (subject: string): boolean => subject.includes('Diplomatiq'),
                (subject: string): boolean => subject.includes('cool'),
            ]);
            expect(result).to.be.true;
        });

        it('should return false if at least one of the async predicates returns false for the subject', async (): Promise<
            void
        > => {
            const result = await PredicateChecker.every('Diplomatiq is cool.', [
                (subject: string): boolean => subject.includes('Diplomatiq'),
                (subject: string): boolean => subject.includes('not cool'),
            ]);
            expect(result).to.be.false;
        });

        it('should return false if predicates is empty', async (): Promise<void> => {
            const result = await PredicateChecker.every('Diplomatiq is cool.', []);
            expect(result).to.be.false;
        });
    });
});
