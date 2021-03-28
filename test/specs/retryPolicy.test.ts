import { expect } from 'chai';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import { RetryPolicy } from '../../src/policies/reactive/retryPolicy/retryPolicy';
import { PolicyModificationNotAllowedException } from '../../src/types/policyModificationNotAllowedException';

describe('RetryPolicy', (): void => {
    let clock: SinonFakeTimers;

    beforeEach((): void => {
        clock = useFakeTimers({
            toFake: ['Date', 'setTimeout', 'clearTimeout'],
            shouldAdvanceTime: false,
        });
    });

    afterEach((): void => {
        clock.restore();
    });

    it('should run the synchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the asynchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the synchronous execution callback and throw its exceptions by default', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should run the asynchronous execution callback and throw its exceptions by default', async (): Promise<void> => {
        const policy = new RetryPolicy();

        try {
            await policy.execute(
                // eslint-disable-next-line @typescript-eslint/require-await
                async (): Promise<unknown> => {
                    throw new Error('TestException');
                },
            );
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should retry on a reactive result once, then return the result by default', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should not retry on a non-reactive result, but return the result', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is not cool.');

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on a reactive result thrice when setting retryCount to 3, then return the result', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on multiple reactive results, then return the result', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is the coolest.');

        let executed = 0;
        let result: string;

        result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(result).to.equal('Diplomatiq is cool.');

        result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is the coolest.';
        });

        expect(executed).to.equal(4);
        expect(result).to.equal('Diplomatiq is the coolest.');
    });

    it('should retry on a reactive exception once, then throw by default', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        let executed = 0;

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(2);
    });

    it('should not retry on a non-reactive exception, but throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        let executed = 0;

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('ArgumentException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('ArgumentException');
        }

        expect(executed).to.equal(1);
    });

    it('should retry on a reactive exception thrice when setting retryCount to 3, then throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.retryCount(3);

        let executed = 0;

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(4);
    });

    it('should retry on multiple reactive exceptions, then throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'ArgumentException');

        let executed = 0;

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(2);

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('ArgumentException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('ArgumentException');
        }

        expect(executed).to.equal(4);
    });

    it('should retry on a reactive result and on a reactive exception as well, then return/throw', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        let executed = 0;

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);

        try {
            await policy.execute((): string => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(4);
    });

    it('should not retry without a reactive result or exception to be handled', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry forever if set', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryForever();

        let executed = 0;

        await policy.execute((): string => {
            executed++;

            if (executed < 10) {
                return 'Diplomatiq is cool.';
            }

            return '';
        });

        expect(executed).to.equal(10);
    });

    it('should run onRetryFn with result filled on retry, before the retried execution', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onRetryExecuted).to.equal(1);
    });

    it('should run onRetryFn with result filled on retry, before the retried execution thrice when setting retryCount to 3', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(3);
    });

    it('should run onRetryFn with error filled on retry, before the retried execution', async (): Promise<void> => {
        const policy = new RetryPolicy();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.onRetry((result: unknown | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(2);
        expect(onRetryExecuted).to.equal(1);
    });

    it('should not run onRetryFn if not retried', async (): Promise<void> => {
        const policy = new RetryPolicy();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.onRetry((): void => {
            onRetryExecuted++;
        });

        await policy.execute((): void => {
            executed++;
        });

        expect(executed).to.equal(1);
        expect(onRetryExecuted).to.equal(0);
    });

    it('should run onRetryFn with error filled on retry, before the retried execution thrice when setting retryCount to 3', async (): Promise<void> => {
        const policy = new RetryPolicy();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.retryCount(3);
        policy.onRetry((result: unknown | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        try {
            await policy.execute((): unknown => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(3);
    });

    it('should await an asynchronous onRetryFn before retrying', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.onRetry(
            async (
                result: string | undefined,
                error: unknown | undefined,
                currentRetryCount: number,
                // eslint-disable-next-line @typescript-eslint/require-await
            ): Promise<void> => {
                expect(result).to.equal('Diplomatiq is cool.');
                expect(error).to.equal(undefined);
                expect(currentRetryCount).to.equal(executed);

                onRetryExecuted++;
                expect(onRetryExecuted).to.equal(currentRetryCount);
            },
        );

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onRetryExecuted).to.equal(1);
    });

    it('should run multiple onRetryFns sequentially on retry', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
        });
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
        });
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 3);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(9);
    });

    it('should run multiple async onRetryFns sequentially on retry', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry(
            async (
                result: string | undefined,
                error: unknown | undefined,
                currentRetryCount: number,
                // eslint-disable-next-line @typescript-eslint/require-await
            ): Promise<void> => {
                expect(result).to.equal('Diplomatiq is cool.');
                expect(error).to.equal(undefined);
                expect(currentRetryCount).to.equal(executed);

                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3);
                onRetryExecuted++;
                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
            },
        );
        policy.onRetry(
            async (
                result: string | undefined,
                error: unknown | undefined,
                currentRetryCount: number,
                // eslint-disable-next-line @typescript-eslint/require-await
            ): Promise<void> => {
                expect(result).to.equal('Diplomatiq is cool.');
                expect(error).to.equal(undefined);
                expect(currentRetryCount).to.equal(executed);

                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
                onRetryExecuted++;
                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
            },
        );
        policy.onRetry(
            async (
                result: string | undefined,
                error: unknown | undefined,
                currentRetryCount: number,
                // eslint-disable-next-line @typescript-eslint/require-await
            ): Promise<void> => {
                expect(result).to.equal('Diplomatiq is cool.');
                expect(error).to.equal(undefined);
                expect(currentRetryCount).to.equal(executed);

                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
                onRetryExecuted++;
                expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 3);
            },
        );

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(9);
    });

    it('should run onFinallyFn after all execution and retries if retried', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number): void => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });
        policy.onFinally((): void => {
            onFinallyExecuted++;

            expect(executed).to.equal(4);
            expect(onRetryExecuted).to.equal(3);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(3);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run onFinallyFn after the execution if not retried', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is not cool.');
        policy.retryCount(3);
        policy.onFinally((): void => {
            onFinallyExecuted++;

            expect(executed).to.equal(1);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run multiple synchronous onFinallyFns sequentially', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.onFinally((): void => {
            expect(onFinallyExecuted).to.equal(0);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(1);
        });
        policy.onFinally((): void => {
            expect(onFinallyExecuted).to.equal(1);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(2);
        });
        policy.onFinally((): void => {
            expect(onFinallyExecuted).to.equal(2);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(3);
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run multiple asynchronous onFinallyFns sequentially', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.onFinally(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onFinallyExecuted).to.equal(0);
                onFinallyExecuted++;
                expect(onFinallyExecuted).to.equal(1);
            },
        );
        policy.onFinally(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onFinallyExecuted).to.equal(1);
                onFinallyExecuted++;
                expect(onFinallyExecuted).to.equal(2);
            },
        );
        policy.onFinally(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onFinallyExecuted).to.equal(2);
                onFinallyExecuted++;
                expect(onFinallyExecuted).to.equal(3);
            },
        );

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run onFinallyFn once, regardless of retryCount', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onFinally((): void => {
            onFinallyExecuted++;
        });

        await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should wait for the specified interval before retry on result if set', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.waitBeforeRetry((): number => 1000);

        let executed = 0;

        const executionPromise = policy.execute((): string => {
            expect(Date.now()).to.equal(executed * 1000);
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(1000);
        expect(executed).to.equal(2);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(2000);
        expect(executed).to.equal(3);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(3000);
        expect(executed).to.equal(4);

        await executionPromise;
        expect(executed).to.equal(4);
    });

    it('should wait for the specified interval (depending on the current retry count) before retry on result if set', async (): Promise<void> => {
        const elapsedTimeHelper = (executed: number): number => {
            return new Array(executed)
                .fill(undefined)
                .map((_value, index): number => (index + 1) * 1000)
                .reduce((acc, curr): number => acc + curr, 0);
        };

        const policy = new RetryPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.waitBeforeRetry((currentRetryCount: number): number => currentRetryCount * 1000);

        let executed = 0;

        const executionPromise = policy.execute((): string => {
            expect(Date.now()).to.equal(elapsedTimeHelper(executed));
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(1000);
        expect(executed).to.equal(2);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(2000);
        expect(Date.now()).to.equal(3000);
        expect(executed).to.equal(3);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(3000);
        expect(Date.now()).to.equal(6000);
        expect(executed).to.equal(4);

        await executionPromise;
        expect(executed).to.equal(4);
    });

    it('should wait for the specified interval before retry on exception if set', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.retryCount(3);
        policy.waitBeforeRetry((): number => 1000);

        let executed = 0;

        const executionPromise = policy
            .execute((): string => {
                expect(Date.now()).to.equal(executed * 1000);
                executed++;
                throw new Error('TestException');
            })
            .catch((ex: Error): void => {
                expect(ex.message).to.equal('TestException');
            });

        expect(executed).to.equal(1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(1000);
        expect(executed).to.equal(2);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(2000);
        expect(executed).to.equal(3);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(3000);
        expect(executed).to.equal(4);

        await executionPromise;
        expect(executed).to.equal(4);
    });

    it('should wait for the specified interval (depending on the current retry count) before retry on exception if set', async (): Promise<void> => {
        const elapsedTimeHelper = (executed: number): number => {
            return new Array(executed)
                .fill(undefined)
                .map((_value, index): number => (index + 1) * 1000)
                .reduce((acc, curr): number => acc + curr, 0);
        };

        const policy = new RetryPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.retryCount(3);
        policy.waitBeforeRetry((currentRetryCount: number): number => currentRetryCount * 1000);

        let executed = 0;

        const executionPromise = policy
            .execute((): string => {
                expect(Date.now()).to.equal(elapsedTimeHelper(executed));
                executed++;
                throw new Error('TestException');
            })
            .catch((ex: Error): void => {
                expect(ex.message).to.equal('TestException');
            });

        expect(executed).to.equal(1);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(1000);
        expect(Date.now()).to.equal(1000);
        expect(executed).to.equal(2);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(2000);
        expect(Date.now()).to.equal(3000);
        expect(executed).to.equal(3);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await clock.tickAsync(3000);
        expect(Date.now()).to.equal(6000);
        expect(executed).to.equal(4);

        await executionPromise;
        expect(executed).to.equal(4);
    });

    it('should not allow to set retryCount during execution', (): void => {
        const policy = new RetryPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.retryCount(2);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to set retryForever during execution', (): void => {
        const policy = new RetryPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.retryForever();
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onRetryFns during execution', (): void => {
        const policy = new RetryPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onRetry((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to set waitBeforeRetry during execution', (): void => {
        const policy = new RetryPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.waitBeforeRetry((): number => 100);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onFinallyFns during execution', (): void => {
        const policy = new RetryPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onFinally((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new RetryPolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.retryCount(1);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.retryForever();
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onRetry((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.waitBeforeRetry((): number => 0);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onFinally((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }
        };

        const executionResolverAddedDeferreds: Array<{
            resolverAddedPromise: Promise<void>;
            resolverAddedResolver: () => void;
        }> = new Array(100).fill(undefined).map((): {
            resolverAddedPromise: Promise<void>;
            resolverAddedResolver: () => void;
        } => {
            let resolverAddedResolver!: () => void;
            const resolverAddedPromise = new Promise<void>((resolve): void => {
                resolverAddedResolver = resolve;
            });

            return {
                resolverAddedPromise,
                resolverAddedResolver,
            };
        });

        const executionResolvers: Array<() => void> = [];

        attemptPolicyModification(false);

        for (let i = 0; i < 100; i++) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            policy.execute(
                // eslint-disable-next-line no-loop-func
                async (): Promise<void> => {
                    await new Promise<void>((resolve): void => {
                        executionResolvers.push(resolve);
                        executionResolverAddedDeferreds[i].resolverAddedResolver();
                    });
                },
            );

            await executionResolverAddedDeferreds[i].resolverAddedPromise;
            expect(executionResolvers.length).to.equal(i + 1);

            attemptPolicyModification(true);
        }

        for (let i = 0; i < 100; i++) {
            executionResolvers[i]();
            attemptPolicyModification(true);
        }

        attemptPolicyModification(false);
    });

    it('should throw error when setting retry count to 0', (): void => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be greater than 0');
        }
    });

    it('should throw error when setting retry count to <0', (): void => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be greater than 0');
        }
    });

    it('should throw error when setting retry count to a non-integer', (): void => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be integer');
        }
    });

    it('should throw error when setting retry count to a non-safe integer', (): void => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be less than or equal to 2^53 - 1');
        }
    });
});
