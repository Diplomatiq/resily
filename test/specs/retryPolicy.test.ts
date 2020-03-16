import { expect } from 'chai';
import { RetryPolicy } from '../../src/policies/reactive/retryPolicy/retryPolicy';

describe('RetryPolicy', (): void => {
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

    it('should run the asynchronous execution callback and throw its exceptions by default', async (): Promise<
        void
    > => {
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

    it('should retry on a given result once, then return the result by default', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(2);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should not retry on a not given result, but return the result', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is not cool.');

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(1);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on a given result thrice when setting retryCount to 3, then return the result', async (): Promise<
        void
    > => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(3);

        let executed = 0;

        const result = await policy.execute((): string => {
            executed++;
            return 'Diplomatiq is cool.';
        });

        expect(executed).to.equal(4);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should retry on multiple given results, then return the result', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is the coolest.');

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

    it('should retry on a given exception once, then throw by default', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');

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

    it('should not retry on a not given exception, but throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');

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

    it('should retry on a given exception thrice when setting retryCount to 3, then throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');
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

    it('should retry on multiple given exceptions, then throw', async (): Promise<void> => {
        const policy = new RetryPolicy();
        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.handleException((e: unknown): boolean => (e as Error).message === 'ArgumentException');

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

    it('should retry on a given result and on a given exception as well, then return/throw', async (): Promise<
        void
    > => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');

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

    it('should not retry without a given result or exception to be handled', async (): Promise<void> => {
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
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

    it('should run onRetryFn with result filled on retry, before the retried execution thrice when setting retryCount to 3', async (): Promise<
        void
    > => {
        const policy = new RetryPolicy<string>();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');
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

    it('should run onRetryFn with error filled on retry, before the retried execution thrice when setting retryCount to 3', async (): Promise<
        void
    > => {
        const policy = new RetryPolicy();

        let executed = 0;
        let onRetryExecuted = 0;

        policy.handleException((e: unknown): boolean => (e as Error).message === 'TestException');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is not cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
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

    it('should wait for the specified interval before retry if set', async (): Promise<void> => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.waitBeforeRetry((): number => 100);

        const executionTimestamps: number[] = [];

        await policy.execute((): string => {
            executionTimestamps.push(Date.now());
            return 'Diplomatiq is cool.';
        });

        expect(executionTimestamps[1] - executionTimestamps[0])
            .to.be.at.least(99)
            .and.to.be.at.most(110);
    });

    it('should wait for the specified interval (depending on the current retry count) before retry if set', async (): Promise<
        void
    > => {
        const policy = new RetryPolicy<string>();
        policy.handleResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.retryCount(2);
        policy.waitBeforeRetry((currentRetryCount: number): number => currentRetryCount * 100);

        const executionTimestamps: number[] = [];

        await policy.execute((): string => {
            executionTimestamps.push(Date.now());
            return 'Diplomatiq is cool.';
        });

        expect(executionTimestamps[1] - executionTimestamps[0])
            .to.be.at.least(99)
            .and.to.be.at.most(110);
        expect(executionTimestamps[2] - executionTimestamps[1])
            .to.be.at.least(198)
            .and.to.be.at.most(210);
    });

    it('should not allow to set retryCount during execution', (): void => {
        const policy = new RetryPolicy();
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
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to set retryForever during execution', (): void => {
        const policy = new RetryPolicy();
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
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to add onRetryFns during execution', (): void => {
        const policy = new RetryPolicy();
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
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to set waitBeforeRetry during execution', (): void => {
        const policy = new RetryPolicy();
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
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to add onFinallyFns during execution', (): void => {
        const policy = new RetryPolicy();
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
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new RetryPolicy<void>();

        await Promise.all([
            ...new Array(100).fill(undefined).map(
                async (): Promise<void> =>
                    policy.execute(
                        async (): Promise<void> =>
                            new Promise((resolve): void => {
                                setTimeout(resolve, 20);
                            }),
                    ),
            ),
            ...new Array(100).fill(undefined).map((): void => {
                try {
                    policy.retryCount(1);
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map((): void => {
                try {
                    policy.retryForever();
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map((): void => {
                try {
                    policy.onRetry((): void => {
                        // empty
                    });
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map((): void => {
                try {
                    policy.waitBeforeRetry((): number => 100);
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
            ...new Array(100).fill(undefined).map((): void => {
                try {
                    policy.onFinally((): void => {
                        // empty
                    });
                    expect.fail('did not throw');
                } catch (ex) {
                    expect((ex as Error).message).to.equal('cannot modify policy during execution');
                }
            }),
        ]);
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
