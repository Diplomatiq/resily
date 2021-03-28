import { RandomGenerator } from '@diplomatiq/crypto-random';
import { expect } from 'chai';
import { BackoffStrategyFactory } from '../../src/policies/reactive/retryPolicy/backoffStrategyFactory';
import { NodeJsEntropyProvider } from '../utils/nodeJsEntropyProvider';
import { windowMock } from '../utils/windowMock';

describe('BackoffStrategyFactory', (): void => {
    describe('constantBackoff', (): void => {
        it('should produce a constant backoff strategy', (): void => {
            const strategy = BackoffStrategyFactory.constantBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(100);
            expect(strategy(4)).to.equal(100);
            expect(strategy(5)).to.equal(100);
        });

        it('should produce a constant backoff strategy with an immediate first retry if set', (): void => {
            const strategy = BackoffStrategyFactory.constantBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(100);
            expect(strategy(4)).to.equal(100);
            expect(strategy(5)).to.equal(100);
        });

        it('should throw error when setting delayMs to 0', (): void => {
            try {
                BackoffStrategyFactory.constantBackoff(0);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to <0', (): void => {
            try {
                BackoffStrategyFactory.constantBackoff(-1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to a non-integer', (): void => {
            try {
                BackoffStrategyFactory.constantBackoff(0.1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be integer');
            }
        });

        it('should throw error when setting delayMs to a non-safe integer', (): void => {
            try {
                BackoffStrategyFactory.constantBackoff(2 ** 53);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be less than or equal to 2^53 - 1');
            }
        });
    });

    describe('linearBackoff', (): void => {
        it('should produce a linear backoff strategy', (): void => {
            const strategy = BackoffStrategyFactory.linearBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(200);
            expect(strategy(3)).to.equal(300);
            expect(strategy(4)).to.equal(400);
            expect(strategy(5)).to.equal(500);
        });

        it('should produce a linear backoff strategy with an immediate first retry if set', (): void => {
            const strategy = BackoffStrategyFactory.linearBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(200);
            expect(strategy(4)).to.equal(300);
            expect(strategy(5)).to.equal(400);
        });

        it('should throw error when setting delayMs to 0', (): void => {
            try {
                BackoffStrategyFactory.linearBackoff(0);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to <0', (): void => {
            try {
                BackoffStrategyFactory.linearBackoff(-1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to a non-integer', (): void => {
            try {
                BackoffStrategyFactory.linearBackoff(0.1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be integer');
            }
        });

        it('should throw error when setting delayMs to a non-safe integer', (): void => {
            try {
                BackoffStrategyFactory.linearBackoff(2 ** 53);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be less than or equal to 2^53 - 1');
            }
        });
    });

    describe('exponentialBackoff', (): void => {
        it('should produce an exponential backoff strategy', (): void => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(200);
            expect(strategy(3)).to.equal(400);
            expect(strategy(4)).to.equal(800);
            expect(strategy(5)).to.equal(1600);
        });

        it('should produce an exponential backoff strategy with an immediate first retry if set', (): void => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(200);
            expect(strategy(4)).to.equal(400);
            expect(strategy(5)).to.equal(800);
        });

        it('should produce an exponential backoff strategy with a custom base if set', (): void => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, false, 3);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(300);
            expect(strategy(3)).to.equal(900);
            expect(strategy(4)).to.equal(2700);
            expect(strategy(5)).to.equal(8100);
        });

        it('should produce an exponential backoff strategy with an immediate first retry and a custom base if set', (): void => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, true, 3);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(300);
            expect(strategy(4)).to.equal(900);
            expect(strategy(5)).to.equal(2700);
        });

        it('should throw error when setting delayMs to 0', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(0);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to <0', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(-1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be greater than 0');
            }
        });

        it('should throw error when setting delayMs to a non-integer', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(0.1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be integer');
            }
        });

        it('should throw error when setting delayMs to a non-safe integer', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(2 ** 53);
            } catch (ex) {
                expect((ex as Error).message).to.equal('delayMs must be less than or equal to 2^53 - 1');
            }
        });

        it('should throw error when setting base to 0', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(100, false, 0);
            } catch (ex) {
                expect((ex as Error).message).to.equal('base must be greater than 0');
            }
        });

        it('should throw error when setting base to <0', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(100, false, -1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('base must be greater than 0');
            }
        });

        it('should throw error when setting base to a non-integer', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(100, false, 0.1);
            } catch (ex) {
                expect((ex as Error).message).to.equal('base must be integer');
            }
        });

        it('should throw error when setting base to a non-safe integer', (): void => {
            try {
                BackoffStrategyFactory.exponentialBackoff(100, false, 2 ** 53);
            } catch (ex) {
                expect((ex as Error).message).to.equal('base must be less than or equal to 2^53 - 1');
            }
        });
    });

    describe('jitteredBackoff', (): void => {
        it('should produce a jittered backoff strategy', async (): Promise<void> => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);
            const strategy = BackoffStrategyFactory.jitteredBackoff(1, 100, false, randomGenerator);

            expect(await strategy(1))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(2))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(3))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(4))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(5))
                .to.be.at.least(0)
                .and.to.be.at.most(100);
        });

        it('should produce a jittered backoff strategy with an immediate first retry if set', async (): Promise<void> => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);
            const strategy = BackoffStrategyFactory.jitteredBackoff(1, 100, true, randomGenerator);

            expect(await strategy(1)).to.equal(0);

            expect(await strategy(2))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(3))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(4))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(5))
                .to.be.at.least(0)
                .and.to.be.at.most(100);
        });

        it('should work with the default random generator where window.crypto.getRandomValues() is available', async (): Promise<void> => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            global.window = windowMock();

            const strategy = BackoffStrategyFactory.jitteredBackoff(1, 100);

            expect(await strategy(1))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(2))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(3))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(4))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            expect(await strategy(5))
                .to.be.at.least(0)
                .and.to.be.at.most(100);

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            global.window = undefined;
        });

        it('should throw error when setting minDelayMs to 0', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(0, 100, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('minDelayMs must be greater than 0');
            }
        });

        it('should throw error when setting minDelayMs to <0', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(-1, 100, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('minDelayMs must be greater than 0');
            }
        });

        it('should throw error when setting minDelayMs to a non-integer', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(0.1, 100, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('minDelayMs must be integer');
            }
        });

        it('should throw error when setting minDelayMs to a non-safe integer', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(2 ** 53, 100, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('minDelayMs must be less than or equal to 2^53 - 1');
            }
        });

        it('should throw error when setting maxDelayMs to 0', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(1, 0, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be greater than 0');
            }
        });

        it('should throw error when setting maxDelayMs to <0', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(1, -1, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be greater than 0');
            }
        });

        it('should throw error when setting maxDelayMs to a non-integer', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(1, 0.1, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be integer');
            }
        });

        it('should throw error when setting maxDelayMs to a non-safe integer', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(1, 2 ** 53, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be less than or equal to 2^53 - 1');
            }
        });

        it('should throw error when setting minDelayMs = maxDelayMs', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(1, 1, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be greater than minDelayMs');
            }
        });

        it('should throw error when setting minDelayMs > maxDelayMs', (): void => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);

            try {
                BackoffStrategyFactory.jitteredBackoff(2, 1, false, randomGenerator);
            } catch (ex) {
                expect((ex as Error).message).to.equal('maxDelayMs must be greater than minDelayMs');
            }
        });
    });
});
