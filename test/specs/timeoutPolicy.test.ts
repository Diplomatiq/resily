import { expect } from 'chai';
import { TimeoutException } from '../../src/policies/proactive/timeoutPolicy/timeoutException';
import { TimeoutPolicy } from '../../src/policies/proactive/timeoutPolicy/timeoutPolicy';
import { PolicyModificationNotAllowedException } from '../../src/types/policyModificationNotAllowedException';

describe('TimeoutPolicy', (): void => {
    it('should run the execution callback and return its result if no timeout is set', async (): Promise<void> => {
        const policy = new TimeoutPolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the execution callback and throw its exceptions if no timeout is set', async (): Promise<void> => {
        const policy = new TimeoutPolicy<void>();

        try {
            await policy.execute(
                // eslint-disable-next-line @typescript-eslint/require-await
                async (): Promise<void> => {
                    throw new Error('TestException');
                },
            );
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should throw a TimeoutException if the execution takes more than the specified time', async (): Promise<
        void
    > => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(10);

        try {
            await policy.execute(
                async (): Promise<void> => {
                    return new Promise((resolve): void => {
                        setTimeout(resolve, 20);
                    });
                },
            );
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }
    });

    it('should not throw a TimeoutException if the execution takes less than the specified time', async (): Promise<
        void
    > => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(20);
        await policy.execute(
            async (): Promise<void> => {
                return new Promise((resolve): void => {
                    setTimeout(resolve, 10);
                });
            },
        );
    });

    it('should run onTimeoutFn on timeout with timedOutAfter filled out', async (): Promise<void> => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(10);
        policy.onTimeout((timedOutAfter): void => {
            expect(timedOutAfter).to.equal(10);
        });

        try {
            await policy.execute(
                async (): Promise<void> => {
                    return new Promise((resolve): void => {
                        setTimeout(resolve, 20);
                    });
                },
            );
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }
    });

    it('should run multiple onTimeoutFns sequentially on timeout', async (): Promise<void> => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(10);

        let onTimeoutCounter = 0;
        policy.onTimeout((): void => {
            expect(onTimeoutCounter).to.equal(0);
            onTimeoutCounter++;
        });
        policy.onTimeout((): void => {
            expect(onTimeoutCounter).to.equal(1);
            onTimeoutCounter++;
        });
        policy.onTimeout((): void => {
            expect(onTimeoutCounter).to.equal(2);
            onTimeoutCounter++;
        });

        try {
            await policy.execute(
                async (): Promise<void> => {
                    // empty
                },
            );
            return new Promise((resolve): void => {
                setTimeout(resolve, 20);
            });
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }
    });

    it('should run multiple async onTimeoutFns sequentially on timeout', async (): Promise<void> => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(10);

        let onTimeoutCounter = 0;
        policy.onTimeout(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onTimeoutCounter).to.equal(0);
                onTimeoutCounter++;
            },
        );
        policy.onTimeout(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onTimeoutCounter).to.equal(1);
                onTimeoutCounter++;
            },
        );
        policy.onTimeout(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onTimeoutCounter).to.equal(2);
                onTimeoutCounter++;
            },
        );

        try {
            await policy.execute(
                async (): Promise<void> => {
                    return new Promise((resolve): void => {
                        setTimeout(resolve, 20);
                    });
                },
            );
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }
    });

    it('should not run onTimeoutFns if the execution callback throws a TimeoutException (if timeout is not set)', async (): Promise<
        void
    > => {
        const policy = new TimeoutPolicy<void>();

        let onTimeoutCounter = 0;
        policy.onTimeout((): void => {
            onTimeoutCounter++;
        });

        try {
            await policy.execute(
                // eslint-disable-next-line @typescript-eslint/require-await
                async (): Promise<void> => {
                    throw new TimeoutException(1);
                },
            );
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }

        expect(onTimeoutCounter).to.equal(0);
    });

    it('should not run onTimeoutFns if the execution callback throws a TimeoutException (if timeout is set)', async (): Promise<
        void
    > => {
        const policy = new TimeoutPolicy<void>();
        policy.timeoutAfter(1000);

        let onTimeoutCounter = 0;
        policy.onTimeout((): void => {
            onTimeoutCounter++;
        });

        try {
            await policy.execute(
                // eslint-disable-next-line @typescript-eslint/require-await
                async (): Promise<void> => {
                    throw new TimeoutException(1);
                },
            );
        } catch (ex) {
            expect(ex instanceof TimeoutException).to.be.true;
        }

        expect(onTimeoutCounter).to.equal(0);
    });

    it('should not allow to set timeoutAfter during execution', (): void => {
        const policy = new TimeoutPolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.timeoutAfter(10);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onTimeoutFns during execution', (): void => {
        const policy = new TimeoutPolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onTimeout((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new TimeoutPolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.timeoutAfter(1000);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onTimeout((): void => {
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

    it('should throw error when setting timeoutAfter to 0', (): void => {
        const policy = new TimeoutPolicy<void>();

        try {
            policy.timeoutAfter(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('timeoutMs must be greater than 0');
        }
    });

    it('should throw error when setting timeoutAfter to <0', (): void => {
        const policy = new TimeoutPolicy<void>();

        try {
            policy.timeoutAfter(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('timeoutMs must be greater than 0');
        }
    });

    it('should throw error when setting timeoutAfter to a non-integer', (): void => {
        const policy = new TimeoutPolicy<void>();

        try {
            policy.timeoutAfter(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('timeoutMs must be integer');
        }
    });

    it('should throw error when setting timeoutAfter to a non-safe integer', (): void => {
        const policy = new TimeoutPolicy<void>();

        try {
            policy.timeoutAfter(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('timeoutMs must be less than or equal to 2^53 - 1');
        }
    });
});
