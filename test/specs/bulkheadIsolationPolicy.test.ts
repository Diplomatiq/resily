import { expect } from 'chai';
import { BulkheadCompartmentRejectedException } from '../../src/policies/proactive/bulkheadIsolationPolicy/bulkheadCompartmentRejectedException';
import { BulkheadIsolationPolicy } from '../../src/policies/proactive/bulkheadIsolationPolicy/bulkheadIsolationPolicy';
import { PolicyModificationNotAllowedException } from '../../src/types/policyModificationNotAllowedException';
import { SuccessDeferred } from '../../src/utils/successDeferred';

describe('BulkheadIsolationPolicy', (): void => {
    it('should run the synchronous execution callback and return its result', async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<string>();
        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the asynchronous execution callback and return its result', async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the synchronous execution callback and throw its exceptions', async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<string>();

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
        const policy = new BulkheadIsolationPolicy();

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

    it('should limit the concurrently running actions to bulkheadCompartmentSize', async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<void>();
        policy.maxConcurrency(1);

        expect(policy.getAvailableSlotsCount()).to.equal(1);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(0);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(0);

        try {
            await policy.execute((): void => {
                // empty
            });
        } catch (ex) {
            expect(ex instanceof BulkheadCompartmentRejectedException).to.be.true;
        }

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(0);
    });

    it('should queue up maximum queueSize actions on hold if already executing bulkheadCompartmentSize actions', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();
        policy.maxConcurrency(1);
        policy.maxQueuedActions(1);

        expect(policy.getAvailableSlotsCount()).to.equal(1);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(1);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(1);

        let executed = false;
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute((): void => {
            executed = true;
        });

        expect(executed).to.be.false;

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(0);
    });

    it('should execute the first queued action if an executed action finishes', async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<void>();
        policy.maxConcurrency(1);
        policy.maxQueuedActions(2);

        const deferred1 = new SuccessDeferred<void>();
        let execute1Started = false;
        let execute1Finished = false;

        const deferred2 = new SuccessDeferred<void>();
        let execute2Started = false;
        let execute2Finished = false;

        const deferred3 = new SuccessDeferred<void>();
        let execute3Started = false;
        let execute3Finished = false;

        expect(policy.getAvailableSlotsCount()).to.equal(1);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(2);
        expect(execute1Started).to.be.false;
        expect(execute1Finished).to.be.false;
        expect(execute2Started).to.be.false;
        expect(execute2Finished).to.be.false;
        expect(execute3Started).to.be.false;
        expect(execute3Finished).to.be.false;

        const executionPromise1 = policy.execute(
            async (): Promise<void> => {
                execute1Started = true;
                await deferred1.promise;
                execute1Finished = true;
            },
        );

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(2);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.false;
        expect(execute2Started).to.be.false;
        expect(execute2Finished).to.be.false;
        expect(execute3Started).to.be.false;
        expect(execute3Finished).to.be.false;

        const executionPromise2 = policy.execute(
            async (): Promise<void> => {
                execute2Started = true;
                await deferred2.promise;
                execute2Finished = true;
            },
        );

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(1);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.false;
        expect(execute2Started).to.be.false;
        expect(execute2Finished).to.be.false;
        expect(execute3Started).to.be.false;
        expect(execute3Finished).to.be.false;

        const executionPromise3 = policy.execute(
            async (): Promise<void> => {
                execute3Started = true;
                await deferred3.promise;
                execute3Finished = true;
            },
        );

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(0);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.false;
        expect(execute2Started).to.be.false;
        expect(execute2Finished).to.be.false;
        expect(execute3Started).to.be.false;
        expect(execute3Finished).to.be.false;

        deferred1.resolve();
        await executionPromise1;

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(1);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.true;
        expect(execute2Started).to.be.true;
        expect(execute2Finished).to.be.false;
        expect(execute3Started).to.be.false;
        expect(execute3Finished).to.be.false;

        deferred2.resolve();
        await executionPromise2;

        expect(policy.getAvailableSlotsCount()).to.equal(0);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(2);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.true;
        expect(execute2Started).to.be.true;
        expect(execute2Finished).to.be.true;
        expect(execute3Started).to.be.true;
        expect(execute3Finished).to.be.false;

        deferred3.resolve();
        await executionPromise3;

        expect(policy.getAvailableSlotsCount()).to.equal(1);
        expect(policy.getAvailableQueuedActionsCount()).to.equal(2);
        expect(execute1Started).to.be.true;
        expect(execute1Finished).to.be.true;
        expect(execute2Started).to.be.true;
        expect(execute2Finished).to.be.true;
        expect(execute3Started).to.be.true;
        expect(execute3Finished).to.be.true;
    });

    it('should not allow to set maxConcurrency during execution', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.maxConcurrency(1);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it('should not allow to set maxQueuedActions during execution', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.maxQueuedActions(1);
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
        }
    });

    it("should be properly mutex'd for running an instance multiple times simultaneously", async (): Promise<void> => {
        const policy = new BulkheadIsolationPolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.maxConcurrency(100);
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect(ex instanceof PolicyModificationNotAllowedException).to.be.true;
            }

            try {
                policy.maxQueuedActions(0);
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

    it('should throw error when setting maxConcurrency to 0', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxConcurrency(0);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('bulkheadCompartmentSize must be greater than 0');
        }
    });

    it('should throw error when setting maxConcurrency to <0', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxConcurrency(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('bulkheadCompartmentSize must be greater than 0');
        }
    });

    it('should throw error when setting maxConcurrency to a non-integer', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxConcurrency(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('bulkheadCompartmentSize must be integer');
        }
    });

    it('should throw error when setting maxConcurrency to a non-safe integer', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxConcurrency(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('bulkheadCompartmentSize must be less than or equal to 2^53 - 1');
        }
    });

    it('should not throw error when setting maxQueuedActions to 0', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();
        policy.maxQueuedActions(0);
    });

    it('should throw error when setting maxQueuedActions to <0', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxQueuedActions(-1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('queueSize must be greater than or equal to 0');
        }
    });

    it('should throw error when setting maxQueuedActions to a non-integer', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxQueuedActions(0.1);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('queueSize must be integer');
        }
    });

    it('should throw error when setting maxQueuedActions to a non-safe integer', (): void => {
        const policy = new BulkheadIsolationPolicy<void>();

        try {
            policy.maxQueuedActions(2 ** 53);
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('queueSize must be less than or equal to 2^53 - 1');
        }
    });
});
