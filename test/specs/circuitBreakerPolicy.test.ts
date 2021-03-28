import { expect } from 'chai';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import { BrokenCircuitException } from '../../src/policies/reactive/circuitBreakerPolicy/brokenCircuitException';
import { CircuitBreakerPolicy } from '../../src/policies/reactive/circuitBreakerPolicy/circuitBreakerPolicy';
import { IsolatedCircuitException } from '../../src/policies/reactive/circuitBreakerPolicy/isolatedCircuitException';
import { PolicyModificationNotAllowedException } from '../../src/types/policyModificationNotAllowedException';

describe('CircuitBreakerPolicy', (): void => {
    let clock: SinonFakeTimers;

    beforeEach((): void => {
        clock = useFakeTimers({
            toFake: ['Date'],
            shouldAdvanceTime: false,
        });
    });

    afterEach((): void => {
        clock.restore();
    });

    it('should run the synchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the asynchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the synchronous execution callback and throw its exceptions by default', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();

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
        const policy = new CircuitBreakerPolicy();

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

    it('should break the circuit on encountering a reactive given result once, then hold the circuit broken for 1 second', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        const breakingResult = await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });
        expect(breakingResult).to.equal('Diplomatiq is broken.');

        expect(policy.getCircuitState()).to.equal('Open');

        const checkIntervalMs = 100;
        for (let elapsedMs = 0; elapsedMs < 1000; elapsedMs += checkIntervalMs) {
            expect(policy.getCircuitState()).to.equal('Open');

            try {
                await policy.execute((): string => {
                    return 'Is Diplomatiq broken?';
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect(ex instanceof BrokenCircuitException).to.be.true;
            }

            expect(policy.getCircuitState()).to.equal('Open');

            clock.tick(checkIntervalMs);

            expect(policy.getCircuitState()).to.equal('Open');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const successResult = await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is cool.';
        });
        expect(successResult).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not break the circuit on encountering a non-reactive result', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        const nonBreakingResult1 = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });
        expect(nonBreakingResult1).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');

        const nonBreakingResult2 = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });
        expect(nonBreakingResult2).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should break the circuit on encountering a reactive result 10 consecutive times, then hold the circuit broken for 30 seconds', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');
        policy.breakAfter(10);
        policy.breakFor(30000);

        for (let i = 1; i <= 10; i++) {
            const breakingResult = await policy.execute((): string => {
                return 'Diplomatiq is broken.';
            });
            expect(breakingResult).to.equal('Diplomatiq is broken.');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const checkIntervalMs = 100;
        for (let elapsedMs = 0; elapsedMs < 30000; elapsedMs += checkIntervalMs) {
            expect(policy.getCircuitState()).to.equal('Open');

            try {
                await policy.execute((): string => {
                    return 'Is Diplomatiq broken?';
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect(ex instanceof BrokenCircuitException).to.be.true;
            }

            expect(policy.getCircuitState()).to.equal('Open');

            clock.tick(checkIntervalMs);

            expect(policy.getCircuitState()).to.equal('Open');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const successResult = await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is cool.';
        });
        expect(successResult).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not break the circuit on encountering a non-reactive result 10 consecutive times', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');
        policy.breakAfter(10);

        for (let i = 1; i <= 10; i++) {
            const result = await policy.execute((): string => {
                return 'Diplomatiq is cool.';
            });
            expect(result).to.equal('Diplomatiq is cool.');
        }

        expect(policy.getCircuitState()).to.equal('Closed');

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });
        expect(result).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should break the circuit on encountering multiple reactive results, altogether 10 consecutive times', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is not cool.');
        policy.breakAfter(10);

        for (let i = 1; i <= 5; i++) {
            await policy.execute((): string => {
                return 'Diplomatiq is broken.';
            });
        }

        expect(policy.getCircuitState()).to.equal('Closed');

        for (let i = 1; i <= 5; i++) {
            await policy.execute((): string => {
                return 'Diplomatiq is not cool.';
            });
        }

        expect(policy.getCircuitState()).to.equal('Open');

        try {
            await policy.execute((): string => {
                return 'Diplomatiq is broken.';
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof BrokenCircuitException).to.be.true;
        }

        expect(policy.getCircuitState()).to.equal('Open');
    });

    it('should break the circuit on encountering a reactive exception once, then hold the circuit broken for 1 second', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const checkIntervalMs = 100;
        for (let elapsedMs = 0; elapsedMs < 1000; elapsedMs += checkIntervalMs) {
            expect(policy.getCircuitState()).to.equal('Open');

            try {
                await policy.execute((): string => {
                    return 'Is Diplomatiq broken?';
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect(ex instanceof BrokenCircuitException).to.be.true;
            }

            expect(policy.getCircuitState()).to.equal('Open');

            clock.tick(checkIntervalMs);

            expect(policy.getCircuitState()).to.equal('Open');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const successResult = await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is cool.';
        });

        expect(successResult).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not break the circuit on encountering a non-reactive exception', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        try {
            await policy.execute((): string => {
                throw new Error('NotTestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('NotTestException');
        }

        expect(policy.getCircuitState()).to.equal('Closed');

        try {
            await policy.execute((): string => {
                throw new Error('NotTestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('NotTestException');
        }

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should break the circuit on encountering a reactive exception 10 consecutive times, then hold the circuit broken for 30 seconds', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.breakAfter(10);
        policy.breakFor(30000);

        for (let i = 1; i <= 10; i++) {
            try {
                await policy.execute((): string => {
                    throw new Error('TestException');
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect((ex as Error).message).to.equal('TestException');
            }
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const checkIntervalMs = 100;
        for (let elapsedMs = 0; elapsedMs < 30000; elapsedMs += checkIntervalMs) {
            expect(policy.getCircuitState()).to.equal('Open');

            try {
                await policy.execute((): string => {
                    return 'Is Diplomatiq broken?';
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect(ex instanceof BrokenCircuitException).to.be.true;
            }

            expect(policy.getCircuitState()).to.equal('Open');

            clock.tick(checkIntervalMs);

            expect(policy.getCircuitState()).to.equal('Open');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        const successResult = await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is cool.';
        });
        expect(successResult).to.equal('Diplomatiq is cool.');

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not break the circuit on encountering a non-reactive exception 10 consecutive times', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.breakAfter(10);

        for (let i = 1; i <= 10; i++) {
            try {
                await policy.execute((): string => {
                    throw new Error('NotTestException');
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect((ex as Error).message).to.equal('NotTestException');
            }
        }

        expect(policy.getCircuitState()).to.equal('Closed');

        try {
            await policy.execute((): string => {
                throw new Error('NotTestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('NotTestException');
        }

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should break the circuit on encountering multiple reactive exceptions, altogether 10 consecutive times', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'AnotherTestException');
        policy.breakAfter(10);

        for (let i = 1; i <= 5; i++) {
            try {
                await policy.execute((): void => {
                    throw new Error('TestException');
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect((ex as Error).message).to.equal('TestException');
            }
        }

        expect(policy.getCircuitState()).to.equal('Closed');

        for (let i = 1; i <= 5; i++) {
            try {
                await policy.execute((): void => {
                    throw new Error('AnotherTestException');
                });
                expect.fail('did not throw');
            } catch (ex) {
                expect((ex as Error).message).to.equal('AnotherTestException');
            }
        }

        expect(policy.getCircuitState()).to.equal('Open');

        try {
            await policy.execute((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof BrokenCircuitException).to.be.true;
        }

        expect(policy.getCircuitState()).to.equal('Open');
    });

    it('should close the circuit after the circuit break duration elapsed, if encountering a non-reactive result', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        expect(policy.getCircuitState()).to.equal('Open');

        clock.tick(1000);

        expect(policy.getCircuitState()).to.equal('Open');

        await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is cool.';
        });

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not close the circuit after the circuit break duration elapsed, if encountering a reactive result', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        expect(policy.getCircuitState()).to.equal('Open');

        clock.tick(1000);

        expect(policy.getCircuitState()).to.equal('Open');

        await policy.execute((): string => {
            expect(policy.getCircuitState() === 'AttemptingClose');
            return 'Diplomatiq is broken.';
        });

        expect(policy.getCircuitState()).to.equal('Open');
    });

    it('should close the circuit after the circuit break duration elapsed, if encountering a non-reactive exception', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        clock.tick(1000);

        expect(policy.getCircuitState()).to.equal('Open');

        try {
            expect(policy.getCircuitState() === 'AttemptingClose');
            await policy.execute((): string => {
                throw new Error('NotHandledTestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('NotHandledTestException');
        }

        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not close the circuit after the circuit break duration elapsed, if encountering a reactive exception', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(policy.getCircuitState()).to.equal('Open');

        clock.tick(1000);

        expect(policy.getCircuitState()).to.equal('Open');

        try {
            expect(policy.getCircuitState() === 'AttemptingClose');
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(policy.getCircuitState()).to.equal('Open');
    });

    it('should isolate the circuit on calling isolate when closed', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        expect(policy.getCircuitState()).to.equal('Closed');
        await policy.isolate();
        expect(policy.getCircuitState()).to.equal('Isolated');
    });

    it('should isolate the circuit on calling isolate when open', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        policy.reactOnResult((): boolean => true);
        await policy.execute((): void => {
            // empty
        });
        expect(policy.getCircuitState()).to.equal('Open');
        await policy.isolate();
        expect(policy.getCircuitState()).to.equal('Isolated');
    });

    it('should throw IsolatedCircuitException when the circuit is isolated', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        await policy.isolate();

        try {
            await policy.execute((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof IsolatedCircuitException).to.be.true;
        }
    });

    it('should reset the circuit on calling reset when isolated', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        await policy.isolate();
        expect(policy.getCircuitState()).to.equal('Isolated');
        await policy.reset();
        expect(policy.getCircuitState()).to.equal('Closed');
    });

    it('should not reset the circuit on calling reset when closed', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        expect(policy.getCircuitState()).to.equal('Closed');

        try {
            await policy.reset();
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot reset if not in Isolated state');
        }
    });

    it('should not reset the circuit on calling reset when open', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();
        policy.reactOnResult((): boolean => true);
        await policy.execute((): void => {
            // empty
        });
        expect(policy.getCircuitState()).to.equal('Open');

        try {
            await policy.reset();
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot reset if not in Isolated state');
        }
    });

    it('should run synchronous onOpenFns sequentially when the circuit transitions to Open state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onOpenRun = 0;
        policy.onOpen((): void => {
            expect(onOpenRun).to.equal(0);
            onOpenRun++;
            expect(onOpenRun).to.equal(1);
        });
        policy.onOpen((): void => {
            expect(onOpenRun).to.equal(1);
            onOpenRun++;
            expect(onOpenRun).to.equal(2);
        });
        policy.onOpen((): void => {
            expect(onOpenRun).to.equal(2);
            onOpenRun++;
            expect(onOpenRun).to.equal(3);
        });

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        expect(onOpenRun).to.equal(3);
    });

    it('should run asynchronous onOpenFns sequentially when the circuit transitions to Open state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onOpenRun = 0;
        policy.onOpen(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onOpenRun).to.equal(0);
                onOpenRun++;
                expect(onOpenRun).to.equal(1);
            },
        );
        policy.onOpen(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onOpenRun).to.equal(1);
                onOpenRun++;
                expect(onOpenRun).to.equal(2);
            },
        );
        policy.onOpen(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onOpenRun).to.equal(2);
                onOpenRun++;
                expect(onOpenRun).to.equal(3);
            },
        );

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        expect(onOpenRun).to.equal(3);
    });

    it('should run synchronous onCloseFns sequentially when the circuit transitions to Closed state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onCloseRun = 0;
        policy.onClose((): void => {
            expect(onCloseRun).to.equal(0);
            onCloseRun++;
            expect(onCloseRun).to.equal(1);
        });
        policy.onClose((): void => {
            expect(onCloseRun).to.equal(1);
            onCloseRun++;
            expect(onCloseRun).to.equal(2);
        });
        policy.onClose((): void => {
            expect(onCloseRun).to.equal(2);
            onCloseRun++;
            expect(onCloseRun).to.equal(3);
        });

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        clock.tick(1000);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onCloseRun).to.equal(3);
    });

    it('should run asynchronous onCloseFns sequentially when the circuit transitions to Closed state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onCloseRun = 0;
        policy.onClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onCloseRun).to.equal(0);
                onCloseRun++;
                expect(onCloseRun).to.equal(1);
            },
        );
        policy.onClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onCloseRun).to.equal(1);
                onCloseRun++;
                expect(onCloseRun).to.equal(2);
            },
        );
        policy.onClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onCloseRun).to.equal(2);
                onCloseRun++;
                expect(onCloseRun).to.equal(3);
            },
        );

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        clock.tick(1000);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onCloseRun).to.equal(3);
    });

    it('should run synchronous onAttemptingCloseFns sequentially when the circuit transitions to AttemptingClose state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onAttemptingCloseRun = 0;
        policy.onAttemptingClose((): void => {
            expect(onAttemptingCloseRun).to.equal(0);
            onAttemptingCloseRun++;
            expect(onAttemptingCloseRun).to.equal(1);
        });
        policy.onAttemptingClose((): void => {
            expect(onAttemptingCloseRun).to.equal(1);
            onAttemptingCloseRun++;
            expect(onAttemptingCloseRun).to.equal(2);
        });
        policy.onAttemptingClose((): void => {
            expect(onAttemptingCloseRun).to.equal(2);
            onAttemptingCloseRun++;
            expect(onAttemptingCloseRun).to.equal(3);
        });

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        clock.tick(1000);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onAttemptingCloseRun).to.equal(3);
    });

    it('should run asynchronous onAttemptingCloseFns sequentially when the circuit transitions to AttemptingClose state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is broken.');

        let onAttemptingCloseRun = 0;
        policy.onAttemptingClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onAttemptingCloseRun).to.equal(0);
                onAttemptingCloseRun++;
                expect(onAttemptingCloseRun).to.equal(1);
            },
        );
        policy.onAttemptingClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onAttemptingCloseRun).to.equal(1);
                onAttemptingCloseRun++;
                expect(onAttemptingCloseRun).to.equal(2);
            },
        );
        policy.onAttemptingClose(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onAttemptingCloseRun).to.equal(2);
                onAttemptingCloseRun++;
                expect(onAttemptingCloseRun).to.equal(3);
            },
        );

        await policy.execute((): string => {
            return 'Diplomatiq is broken.';
        });

        clock.tick(1000);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onAttemptingCloseRun).to.equal(3);
    });

    it('should run synchronous onIsolateFns sequentially when the circuit transitions to Isolated state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();

        let onIsolateRun = 0;
        policy.onIsolate((): void => {
            expect(onIsolateRun).to.equal(0);
            onIsolateRun++;
            expect(onIsolateRun).to.equal(1);
        });
        policy.onIsolate((): void => {
            expect(onIsolateRun).to.equal(1);
            onIsolateRun++;
            expect(onIsolateRun).to.equal(2);
        });
        policy.onIsolate((): void => {
            expect(onIsolateRun).to.equal(2);
            onIsolateRun++;
            expect(onIsolateRun).to.equal(3);
        });

        await policy.isolate();

        expect(onIsolateRun).to.equal(3);
    });

    it('should run asynchronous onIsolateFns sequentially when the circuit transitions to Isolated state', async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<string>();

        let onIsolateRun = 0;
        policy.onIsolate(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onIsolateRun).to.equal(0);
                onIsolateRun++;
                expect(onIsolateRun).to.equal(1);
            },
        );
        policy.onIsolate(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onIsolateRun).to.equal(1);
                onIsolateRun++;
                expect(onIsolateRun).to.equal(2);
            },
        );
        policy.onIsolate(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<void> => {
                expect(onIsolateRun).to.equal(2);
                onIsolateRun++;
                expect(onIsolateRun).to.equal(3);
            },
        );

        await policy.isolate();

        expect(onIsolateRun).to.equal(3);
    });

    it('should not allow to set breakAfter during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.breakAfter(1);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to set breakFor during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.breakFor(1);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onOpenFns during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onOpen((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onCloseFns during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onClose((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onAttemptingCloseFns during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onAttemptingClose((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onIsolateFns during execution', (): void => {
        const policy = new CircuitBreakerPolicy();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onIsolate((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new CircuitBreakerPolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.breakAfter(1);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.breakFor(1000);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onClose((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onOpen((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onAttemptingClose((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onIsolate((): void => {
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

    it('should throw error when setting numberOfConsecutiveReactionsBeforeCircuitBreak to 0', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakAfter(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal(
                'numberOfConsecutiveReactionsBeforeCircuitBreak must be greater than 0',
            );
        }
    });

    it('should throw error when setting numberOfConsecutiveReactionsBeforeCircuitBreak to <0', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakAfter(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal(
                'numberOfConsecutiveReactionsBeforeCircuitBreak must be greater than 0',
            );
        }
    });

    it('should throw error when setting numberOfConsecutiveReactionsBeforeCircuitBreak to a non-integer', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakAfter(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('numberOfConsecutiveReactionsBeforeCircuitBreak must be integer');
        }
    });

    it('should throw error when setting numberOfConsecutiveReactionsBeforeCircuitBreak to a non-safe integer', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakAfter(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal(
                'numberOfConsecutiveReactionsBeforeCircuitBreak must be less than or equal to 2^53 - 1',
            );
        }
    });

    it('should throw error when setting durationOfCircuitBreakMs to 0', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakFor(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('durationOfCircuitBreakMs must be greater than 0');
        }
    });

    it('should throw error when setting durationOfCircuitBreakMs to <0', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakFor(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('durationOfCircuitBreakMs must be greater than 0');
        }
    });

    it('should throw error when setting durationOfCircuitBreakMs to a non-integer', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakFor(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('durationOfCircuitBreakMs must be integer');
        }
    });

    it('should throw error when setting durationOfCircuitBreakMs to a non-safe integer', (): void => {
        const policy = new CircuitBreakerPolicy();
        try {
            policy.breakFor(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('durationOfCircuitBreakMs must be less than or equal to 2^53 - 1');
        }
    });

    it('should not allow to transition to invalid states', (): void => {
        const policy = new CircuitBreakerPolicy<string>();
        expect(policy.getCircuitState()).to.equal('Closed');
        try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            policy.validateTransition(new Set(['AttemptingClose']));
        } catch (ex) {
            expect((ex as Error).message === 'invalid transition');
        }
    });
});
