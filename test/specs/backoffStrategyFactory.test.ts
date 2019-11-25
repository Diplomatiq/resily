import { RandomGenerator } from '@diplomatiq/crypto-random';
import { expect } from 'chai';
import { BackoffStrategyFactory } from '../../src/policies/reactive/retryPolicy/backoffStrategyFactory';
import { NodeJsEntropyProvider } from '../utils/nodeJsEntropyProvider';
import { windowMock } from '../utils/windowMock';

describe('BackoffStrategyFactory', () => {
    describe('constantBackoff', () => {
        it('should produce a constant backoff strategy', () => {
            const strategy = BackoffStrategyFactory.constantBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(100);
            expect(strategy(4)).to.equal(100);
            expect(strategy(5)).to.equal(100);
        });

        it('should produce a constant backoff strategy with an immediate first retry if set', () => {
            const strategy = BackoffStrategyFactory.constantBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(100);
            expect(strategy(4)).to.equal(100);
            expect(strategy(5)).to.equal(100);
        });
    });

    describe('linearBackoff', () => {
        it('should produce a linear backoff strategy', () => {
            const strategy = BackoffStrategyFactory.linearBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(200);
            expect(strategy(3)).to.equal(300);
            expect(strategy(4)).to.equal(400);
            expect(strategy(5)).to.equal(500);
        });

        it('should produce a linear backoff strategy with an immediate first retry if set', () => {
            const strategy = BackoffStrategyFactory.linearBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(200);
            expect(strategy(4)).to.equal(300);
            expect(strategy(5)).to.equal(400);
        });
    });

    describe('exponentialBackoff', () => {
        it('should produce an exponential backoff strategy', () => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(200);
            expect(strategy(3)).to.equal(400);
            expect(strategy(4)).to.equal(800);
            expect(strategy(5)).to.equal(1600);
        });

        it('should produce an exponential backoff strategy with an immediate first retry if set', () => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, true);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(200);
            expect(strategy(4)).to.equal(400);
            expect(strategy(5)).to.equal(800);
        });

        it('should produce an exponential backoff strategy with a custom base if set', () => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, false, 3);
            expect(strategy(1)).to.equal(100);
            expect(strategy(2)).to.equal(300);
            expect(strategy(3)).to.equal(900);
            expect(strategy(4)).to.equal(2700);
            expect(strategy(5)).to.equal(8100);
        });

        it('should produce an exponential backoff strategy with an immediate first retry and a custom base if set', () => {
            const strategy = BackoffStrategyFactory.exponentialBackoff(100, true, 3);
            expect(strategy(1)).to.equal(0);
            expect(strategy(2)).to.equal(100);
            expect(strategy(3)).to.equal(300);
            expect(strategy(4)).to.equal(900);
            expect(strategy(5)).to.equal(2700);
        });
    });

    describe('jitteredBackoff', () => {
        it('should produce a jittered backoff strategy', async () => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);
            const strategy = BackoffStrategyFactory.jitteredBackoff(0, 100, false, randomGenerator);

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

        it('should produce a jittered backoff strategy with an immediate first retry if set', async () => {
            const entropyProvider = new NodeJsEntropyProvider();
            const randomGenerator = new RandomGenerator(entropyProvider);
            const strategy = BackoffStrategyFactory.jitteredBackoff(0, 100, true, randomGenerator);

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

        it('should work with the default random generator where window.crypto.getRandomValues() is available', async () => {
            // @ts-ignore
            global.window = windowMock();

            const strategy = BackoffStrategyFactory.jitteredBackoff(0, 100);

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

            // @ts-ignore
            global.window = undefined;
        });
    });
});
