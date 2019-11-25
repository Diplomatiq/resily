import { expect } from 'chai';
import { RetryPolicy } from '../../src/policies/reactive/retryPolicy/retryPolicy';

describe('RetryPolicy', () => {
    it('should run the execution callback and return its result by default', async () => {
        const policy = new RetryPolicy<string>();
        const result = await policy.execute(() => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the async execution callback and return its result by default', async () => {
        const policy = new RetryPolicy<string>();
        const result = await policy.execute(async () => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the execution callback and throw its exceptions by default', async () => {
        const policy = new RetryPolicy<string>();

        try {
            await policy.execute(() => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should run the async execution callback and throw its exceptions by default', async () => {
        const policy = new RetryPolicy<string>();

        try {
            await policy.execute(() => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should retry on a given result once, then return the result by default', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');

        let executed = 0;

        const result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should not retry on a not given result, but return the result', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is not cool.');

        let executed = 0;

        const result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on a given result thrice when setting retryCount to 3, then return the result', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);

        let executed = 0;

        const result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on multiple given results, then return the result', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.handleResult((r: string) => r === 'Diplomatiq is the coolest.');

        let executed = 0;
        let result: string;

        result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(result).to.equal('Diplomatiq is cool.');

        result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is the coolest.';
        });

        expect(executed).to.equal(4);
        expect(result).to.equal('Diplomatiq is the coolest.');
    });

    it('should retry on a given exception once, then throw by default', async () => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');

        let executed = 0;

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(2);
    });

    it('should not retry on a not given exception, but throw', async () => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');

        let executed = 0;

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('ArgumentException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('ArgumentException');
        }

        expect(executed).to.equal(1);
    });

    it('should retry on a given exception thrice when setting retryCount to 3, then throw', async () => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');
        policy.retryCount(3);

        let executed = 0;

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(4);
    });

    it('should retry on multiple given exceptions, then throw', async () => {
        const policy = new RetryPolicy<boolean>();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');
        policy.handleException((e: unknown) => (e as Error).message === 'ArgumentException');

        let executed = 0;

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(2);

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('ArgumentException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('ArgumentException');
        }

        expect(executed).to.equal(4);
    });

    it('should retry on a given result and on a given exception as well, then return/throw', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');

        let executed = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);

        try {
            await policy.execute(() => {
                executed++;
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(executed).to.equal(4);
    });

    it('should not retry without a given result or exception to be handled', async () => {
        const policy = new RetryPolicy<string>();

        let executed = 0;

        const result = await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry forever if set', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryForever();

        let executed = 0;

        await policy.execute(() => {
            executed++;

            if (executed < 10) {
                return 'Diplomatiq is cool.';
            }

            return '';
        });

        expect(executed).to.equal(10);
    });

    it('should run onRetryFn with result filled on retry, before the retried execution', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onRetryExecuted).to.equal(1);
    });

    it('should run onRetryFn with result filled on retry, before the retried execution thrice when setting retryCount to 3', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(3);
    });

    it('should run onRetryFn with error filled on retry, before the retried execution', async () => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');
        policy.onRetry((result: unknown | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        try {
            await policy.execute(() => {
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

    it('should run onRetryFn with error filled on retry, before the retried execution thrice when setting retryCount to 3', async () => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown) => (e as Error).message === 'TestException');
        policy.retryCount(3);
        policy.onRetry((result: unknown | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        try {
            await policy.execute(() => {
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

    it('should await an async onRetryFn before retrying', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.onRetry(async (result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onRetryExecuted).to.equal(1);
    });

    it('should run multiple onRetryFns sequentially on retry', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
        });
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
        });
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 3);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(9);
    });

    it('should run multiple async onRetryFns sequentially on retry', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry(async (result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
        });
        policy.onRetry(async (result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 1);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
        });
        policy.onRetry(async (result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 2);
            onRetryExecuted++;
            expect(onRetryExecuted).to.equal((currentRetryCount - 1) * 3 + 3);
        });

        let executed = 0;
        let onRetryExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(9);
    });

    it('should run onFinallyFn after all execution and retries if retried', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onRetry((result: string | undefined, error: unknown | undefined, currentRetryCount: number) => {
            expect(result).to.equal('Diplomatiq is cool.');
            expect(error).to.equal(undefined);
            expect(currentRetryCount).to.equal(executed);

            onRetryExecuted++;
            expect(onRetryExecuted).to.equal(currentRetryCount);
        });
        policy.onFinally(() => {
            onFinallyExecuted++;

            expect(executed).to.equal(4);
            expect(onRetryExecuted).to.equal(3);
        });

        let executed = 0;
        let onRetryExecuted = 0;
        let onFinallyExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onRetryExecuted).to.equal(3);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run onFinallyFn after the execution if not retried', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is not cool.');
        policy.retryCount(3);
        policy.onFinally(() => {
            onFinallyExecuted++;

            expect(executed).to.equal(1);
        });

        let executed = 0;
        let onFinallyExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run multiple onFinallyFns sequentially', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.onFinally(() => {
            expect(onFinallyExecuted).to.equal(0);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(1);
        });
        policy.onFinally(() => {
            expect(onFinallyExecuted).to.equal(1);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(2);
        });
        policy.onFinally(() => {
            expect(onFinallyExecuted).to.equal(2);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(3);
        });

        let executed = 0;
        let onFinallyExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run multiple async onFinallyFns sequentially', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.onFinally(async () => {
            expect(onFinallyExecuted).to.equal(0);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(1);
        });
        policy.onFinally(async () => {
            expect(onFinallyExecuted).to.equal(1);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(2);
        });
        policy.onFinally(async () => {
            expect(onFinallyExecuted).to.equal(2);
            onFinallyExecuted++;
            expect(onFinallyExecuted).to.equal(3);
        });

        let executed = 0;
        let onFinallyExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run onFinallyFn once, regardless of retryCount', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(3);
        policy.onFinally(() => {
            onFinallyExecuted++;
        });

        let executed = 0;
        let onFinallyExecuted = 0;

        await policy.execute(() => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should wait for the specified interval before retry if set', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.waitBeforeRetry(() => 100);

        const executionTimestamps: number[] = [];

        await policy.execute(() => {
            executionTimestamps.push(Date.now());
            return 'Diplomatiq is cool.';
        });

        expect(executionTimestamps[1] - executionTimestamps[0])
            .to.be.at.least(100)
            .and.to.be.at.most(110);
    });

    it('should wait for the specified interval (depending on the current retry count) before retry if set', async () => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string) => r === 'Diplomatiq is cool.');
        policy.retryCount(2);
        policy.waitBeforeRetry((currentRetryCount: number) => currentRetryCount * 100);

        const executionTimestamps: number[] = [];

        await policy.execute(() => {
            executionTimestamps.push(Date.now());
            return 'Diplomatiq is cool.';
        });

        expect(executionTimestamps[1] - executionTimestamps[0])
            .to.be.at.least(100)
            .and.to.be.at.most(110);
        expect(executionTimestamps[2] - executionTimestamps[1])
            .to.be.at.least(200)
            .and.to.be.at.most(210);
    });

    it('should not allow to set retryCount during execution', () => {
        const policy = new RetryPolicy();
        policy.execute(async () => {
            await new Promise(() => {});
        });

        try {
            policy.retryCount(2);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to set retryForever during execution', () => {
        const policy = new RetryPolicy();
        policy.execute(async () => {
            await new Promise(() => {});
        });

        try {
            policy.retryForever();
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to add onRetryFns during execution', () => {
        const policy = new RetryPolicy();
        policy.execute(async () => {
            await new Promise(() => {});
        });

        try {
            policy.onRetry(() => {});
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to set waitBeforeRetry during execution', () => {
        const policy = new RetryPolicy();
        policy.execute(async () => {
            await new Promise(() => {});
        });

        try {
            policy.waitBeforeRetry(() => 100);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to add onFinallyFns during execution', () => {
        const policy = new RetryPolicy();
        policy.execute(async () => {
            await new Promise(() => {});
        });

        try {
            policy.onFinally(() => {});
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async () => {
        const policy = new RetryPolicy<void>();

        await Promise.all([
            ...new Array(100)
                .fill(undefined)
                .map(() => policy.execute(() => new Promise(resolve => setTimeout(resolve, 20)))),
            ...new Array(100).fill(undefined).map(() => {
                try {
                    policy.retryCount(1);
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map(() => {
                try {
                    policy.retryForever();
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map(() => {
                try {
                    policy.onRetry(() => {});
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map(() => {
                try {
                    policy.waitBeforeRetry(() => 100);
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map(() => {
                try {
                    policy.onFinally(() => {});
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
        ]);
    });

    it('should throw error when setting retry count to 0', () => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be greater than 0');
        }
    });

    it('should throw error when setting retry count to <0', () => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be greater than 0');
        }
    });

    it('should throw error when setting retry count to a non-integer', () => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be integer');
        }
    });

    it('should throw error when setting retry count to a non-safe integer', () => {
        const policy = new RetryPolicy();
        try {
            policy.retryCount(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('retryCount must be less than 2^53 - 1');
        }
    });
});
