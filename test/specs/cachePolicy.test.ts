import { expect } from 'chai';
import { SinonFakeTimers, useFakeTimers } from 'sinon';
import { CachePolicy } from '../../src/policies/proactive/cachePolicy/cachePolicy';
import { PolicyModificationNotAllowedException } from '../../src/types/policyModificationNotAllowedException';

describe('CachePolicy', (): void => {
    let clock: SinonFakeTimers;

    beforeEach((): void => {
        clock = useFakeTimers({
            now: Date.now(),
            toFake: ['Date'],
            shouldAdvanceTime: false,
        });
    });

    afterEach((): void => {
        clock.restore();
    });

    it('should run the synchronous execution callback and return its result', async (): Promise<void> => {
        const policy = new CachePolicy<string>();
        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the asynchronous execution callback and return its result', async (): Promise<void> => {
        const policy = new CachePolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the synchronous execution callback and throw its exceptions', async (): Promise<void> => {
        const policy = new CachePolicy<string>();

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should run the asynchronous execution callback and throw its exceptions', async (): Promise<void> => {
        const policy = new CachePolicy();

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

    it("should hold the cache valid for Date.now() + 10000ms from each update if setting timeToLive('relative', 10000)", async (): Promise<
        void
    > => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('relative', 10000);

        let result: string;
        let executed = 0;

        const checkIntervalMs = 100;

        const executor = (returnValue: string): string => {
            executed++;
            return returnValue;
        };

        result = await policy.execute((): string => executor('Diplomatiq is cool.'));
        expect(result).to.equal('Diplomatiq is cool.');
        expect(executed).to.equal(1);

        for (let elapsedMs = 0; elapsedMs < 10000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is bad.'));
            expect(result).to.equal('Diplomatiq is cool.');
            expect(executed).to.equal(1);
            clock.tick(checkIntervalMs);
        }

        result = await policy.execute((): string => executor('No, Diplomatiq is cool.'));
        expect(result).to.equal('No, Diplomatiq is cool.');
        expect(executed).to.equal(2);

        for (let elapsedMs = 0; elapsedMs < 10000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('No, Diplomatiq is bad.'));
            expect(result).to.equal('No, Diplomatiq is cool.');
            expect(executed).to.equal(2);
            clock.tick(checkIntervalMs);
        }

        result = await policy.execute((): string => executor('Diplomatiq is actually cool.'));
        expect(result).to.equal('Diplomatiq is actually cool.');
        expect(executed).to.equal(3);
    });

    it("should hold the cache valid for Date.now() + 10000ms if setting timeToLive('absolute', Date.now() + 10000ms)", async (): Promise<
        void
    > => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('absolute', Date.now() + 10000);

        let result: string;
        let executed = 0;

        const executor = (returnValue: string): string => {
            executed++;
            return returnValue;
        };

        const checkIntervalMs = 100;

        result = await policy.execute((): string => executor('Diplomatiq is cool.'));
        expect(result).to.equal('Diplomatiq is cool.');
        expect(executed).to.equal(1);

        for (let elapsedMs = 0; elapsedMs < 10000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is bad.'));
            expect(result).to.equal('Diplomatiq is cool.');
            expect(executed).to.equal(1);
            clock.tick(checkIntervalMs);
        }

        result = await policy.execute((): string => executor('Diplomatiq is cool.'));
        expect(result).to.equal('Diplomatiq is cool.');
        expect(executed).to.equal(2);

        result = await policy.execute((): string => executor('Diplomatiq is cooler.'));
        expect(result).to.equal('Diplomatiq is cooler.');
        expect(executed).to.equal(3);

        result = await policy.execute((): string => executor('Diplomatiq is way cooler.'));
        expect(result).to.equal('Diplomatiq is way cooler.');
        expect(executed).to.equal(4);

        result = await policy.execute((): string => executor('Diplomatiq is the best.'));
        expect(result).to.equal('Diplomatiq is the best.');
        expect(executed).to.equal(5);
    });

    it("should hold the cache valid for Date.now() + 10000ms from each interaction if setting timeToLive('sliding', 10000)", async (): Promise<
        void
    > => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('sliding', 10000);

        let result: string;
        let executed = 0;

        const executor = (returnValue: string): string => {
            executed++;
            return returnValue;
        };

        const checkIntervalMs = 100;

        result = await policy.execute((): string => executor('Diplomatiq is cool.'));
        expect(result).to.equal('Diplomatiq is cool.');
        expect(executed).to.equal(1);

        for (let elapsedMs = 0; elapsedMs < 20000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is bad.'));
            expect(result).to.equal('Diplomatiq is cool.');
            expect(executed).to.equal(1);
            clock.tick(checkIntervalMs);
        }

        clock.tick(10000);

        result = await policy.execute((): string => executor('No, Diplomatiq is cool.'));
        expect(result).to.equal('No, Diplomatiq is cool.');
        expect(executed).to.equal(2);

        for (let elapsedMs = 0; elapsedMs < 20000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('No, Diplomatiq is bad.'));
            expect(result).to.equal('No, Diplomatiq is cool.');
            expect(executed).to.equal(2);
            clock.tick(checkIntervalMs);
        }

        clock.tick(10000);

        result = await policy.execute((): string => executor('Diplomatiq is actually cool.'));
        expect(result).to.equal('Diplomatiq is actually cool.');
        expect(executed).to.equal(3);

        for (let elapsedMs = 0; elapsedMs < 20000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is actually bad.'));
            expect(result).to.equal('Diplomatiq is actually cool.');
            expect(executed).to.equal(3);
            clock.tick(checkIntervalMs);
        }
    });

    it('should invalidate the cache on invalidate', async (): Promise<void> => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('relative', 10000);

        let result: string;
        let executed = 0;

        const executor = (returnValue: string): string => {
            executed++;
            return returnValue;
        };

        const checkIntervalMs = 100;

        result = await policy.execute((): string => executor('Diplomatiq is cool.'));
        expect(result).to.equal('Diplomatiq is cool.');
        expect(executed).to.equal(1);

        for (let elapsedMs = 0; elapsedMs < 5000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is bad.'));
            expect(result).to.equal('Diplomatiq is cool.');
            expect(executed).to.equal(1);
            clock.tick(checkIntervalMs);
        }

        policy.invalidate();

        result = await policy.execute((): string => executor('Diplomatiq is very cool.'));
        expect(result).to.equal('Diplomatiq is very cool.');
        expect(executed).to.equal(2);

        for (let elapsedMs = 0; elapsedMs < 10000; elapsedMs += checkIntervalMs) {
            result = await policy.execute((): string => executor('Diplomatiq is very bad.'));
            expect(result).to.equal('Diplomatiq is very cool.');
            expect(executed).to.equal(2);
            clock.tick(checkIntervalMs);
        }

        result = await policy.execute((): string => executor('Diplomatiq is very cool.'));
        expect(result).to.equal('Diplomatiq is very cool.');
        expect(executed).to.equal(3);
    });

    it('should run onCacheGetFns (but should not run onCacheMissFns and onCachePutFns) each time when the value is retrieved from the cache', async (): Promise<
        void
    > => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('relative', 10000);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        let onCacheGetExecuted = 0;
        let onCacheMissExecuted = 0;
        let onCachePutExecuted = 0;

        policy.onCacheGet((): void => {
            onCacheGetExecuted++;
        });

        policy.onCacheMiss((): void => {
            onCacheMissExecuted++;
        });

        policy.onCachePut((): void => {
            onCachePutExecuted++;
        });

        expect(onCacheGetExecuted).to.equal(0);
        expect(onCacheMissExecuted).to.equal(0);
        expect(onCachePutExecuted).to.equal(0);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onCacheGetExecuted).to.equal(1);
        expect(onCacheMissExecuted).to.equal(0);
        expect(onCachePutExecuted).to.equal(0);

        await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(onCacheGetExecuted).to.equal(2);
        expect(onCacheMissExecuted).to.equal(0);
        expect(onCachePutExecuted).to.equal(0);
    });

    it('should run onCacheMissFns before, and onCachePutFns after the value is retreived by executing the wrapped method (but should not run onCacheGetFns)', async (): Promise<
        void
    > => {
        const policy = new CachePolicy<string>();
        policy.timeToLive('relative', 10000);

        let onCacheGetExecuted = 0;
        let onCacheMissExecuted = 0;
        let onCachePutExecuted = 0;

        policy.onCacheGet((): void => {
            onCacheGetExecuted++;
        });

        policy.onCacheMiss((): void => {
            onCacheMissExecuted++;
        });

        policy.onCachePut((): void => {
            onCachePutExecuted++;
        });

        expect(onCacheGetExecuted).to.equal(0);
        expect(onCacheMissExecuted).to.equal(0);
        expect(onCachePutExecuted).to.equal(0);

        await policy.execute((): string => {
            expect(onCacheGetExecuted).to.equal(0);
            expect(onCacheMissExecuted).to.equal(1);
            expect(onCachePutExecuted).to.equal(0);
            return 'Diplomatiq is cool.';
        });

        expect(onCacheGetExecuted).to.equal(0);
        expect(onCacheMissExecuted).to.equal(1);
        expect(onCachePutExecuted).to.equal(1);
    });

    it('should not allow to set timeToLive during exception', (): void => {
        const policy = new CachePolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                // will not resolve
            },
        );

        try {
            policy.timeToLive('relative', 1000);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onCacheGetFns during exception', (): void => {
        const policy = new CachePolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                // will not resolve
            },
        );

        try {
            policy.onCacheGet((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onCachePutFns during exception', (): void => {
        const policy = new CachePolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                // will not resolve
            },
        );

        try {
            policy.onCachePut((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to add onCacheMissFns during exception', (): void => {
        const policy = new CachePolicy<void>();
        policy.execute(
            async (): Promise<void> => {
                // will not resolve
            },
        );

        try {
            policy.onCacheMiss((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new CachePolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.timeToLive('relative', 1000);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onCacheGet((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onCachePut((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.onCacheMiss((): void => {
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

    it('should throw error when setting timeToLive to 0', (): void => {
        const policy = new CachePolicy();

        try {
            policy.timeToLive('relative', 0);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }

        try {
            policy.timeToLive('absolute', 0);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }

        try {
            policy.timeToLive('sliding', 0);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }
    });

    it('should throw error when setting timeToLive to <0', (): void => {
        const policy = new CachePolicy();

        try {
            policy.timeToLive('relative', -1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }

        try {
            policy.timeToLive('absolute', -1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }

        try {
            policy.timeToLive('sliding', -1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be greater than 0');
        }
    });

    it('should throw error when setting timeToLive to a non-integer', (): void => {
        const policy = new CachePolicy();

        try {
            policy.timeToLive('relative', 0.1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be integer');
        }

        try {
            policy.timeToLive('absolute', 0.1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be integer');
        }

        try {
            policy.timeToLive('sliding', 0.1);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be integer');
        }
    });

    it('should throw error when setting timeToLive to a non-safe integer', (): void => {
        const policy = new CachePolicy();

        try {
            policy.timeToLive('relative', 2 ** 53);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be less than or equal to 2^53 - 1');
        }

        try {
            policy.timeToLive('absolute', 2 ** 53);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be less than or equal to 2^53 - 1');
        }

        try {
            policy.timeToLive('sliding', 2 ** 53);
        } catch (ex) {
            expect((ex as Error).message).to.equal('value must be less than or equal to 2^53 - 1');
        }
    });
});
