import { expect } from 'chai';
import { FallbackChainExhaustedException } from '../../src/policies/reactive/fallbackPolicy/fallbackChainExhaustedException';
import { FallbackPolicy } from '../../src/policies/reactive/fallbackPolicy/fallbackPolicy';

describe('FallbackPolicy', (): void => {
    it('should run the synchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();
        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the asynchronous execution callback and return its result by default', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();
        const result = await policy.execute(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should run the synchronous execution callback and throw its exceptions by default', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

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
        const policy = new FallbackPolicy();

        try {
            await policy.execute((): unknown => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should fallback on a reactive (i.e. wrong) result, then return the result of the synchronous fallback function', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.fallback((): string => {
            return 'Diplomatiq is the coolest.';
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is the coolest.');
    });

    it('should fallback on a reactive (i.e. wrong) result, then return the result of the asynchronous fallback function', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is the coolest.';
            },
        );

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is the coolest.');
    });

    it('should not fallback on a non-reactive (i.e. right) result, but return the result', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is not cool.');

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should fallback along a synchronous fallback chain sequentially while it produces reactive (i.e. wrong) result until the first non-reactive (i.e. right) result is produced', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is cool.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is cool.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is the coolest.';
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is the coolest.');
        expect(fallbacksExecuted).to.equal(3);
    });

    it('should fallback along an asynchronous fallback chain sequentially while it produces reactive (i.e. wrong) result, until the first non-reactive (i.e. right) result is produced', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is cool.');

        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(0);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(1);
                return 'Diplomatiq is cool.';
            },
        );
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(1);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(2);
                return 'Diplomatiq is cool.';
            },
        );
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(2);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(3);
                return 'Diplomatiq is the coolest.';
            },
        );

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is the coolest.');
        expect(fallbacksExecuted).to.equal(3);
    });

    it('should fallback on multiple reactive (i.e. wrong) results if any of them occurs', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is not cool.');
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is the worst.');

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is the worst.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is not cool.';
        });

        expect(fallbacksExecuted).to.equal(3);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should fallback on any result until an exception is thrown', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnResult((): boolean => true);

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is cool.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is cool.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            throw new Error('TestException');
        });

        try {
            await policy.execute((): string => {
                return 'Diplomatiq is cool.';
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }

        expect(fallbacksExecuted).to.equal(3);
    });

    it('should fallback on a reactive exception, then return the result of the synchronous fallback function', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.fallback((): string => {
            return 'Diplomatiq is cool.';
        });

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should fallback on a reactive exception, then return the result of the asynchronous fallback function', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                return 'Diplomatiq is cool.';
            },
        );

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should not fallback on a non-reactive exception, but throw the exception', async (): Promise<void> => {
        const policy = new FallbackPolicy<void>();
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'AnotherException');

        try {
            await policy.execute((): void => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('TestException');
        }
    });

    it('should fallback along a synchronous fallback chain sequentially while it throws reactive exception result until the first non-reactive exception is thrown', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            throw new Error('TestException');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            throw new Error('TestException');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
    });

    it('should fallback along an asynchronous fallback chain sequentially while it throws reactive exception until the first non-reactive exception is thrown', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');

        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(0);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(1);
                throw new Error('TestException');
            },
        );
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(1);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(2);
                throw new Error('TestException');
            },
        );
        policy.fallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (): Promise<string> => {
                expect(fallbacksExecuted).to.equal(2);
                fallbacksExecuted++;
                expect(fallbacksExecuted).to.equal(3);
                return 'Diplomatiq is cool.';
            },
        );

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
    });

    it('should fallback on multiple reactive exceptions if any of them occurs', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'ExceptionOne');
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'ExceptionTwo');
        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'ExceptionThree');

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            throw new Error('ExceptionTwo');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            throw new Error('ExceptionThree');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });

        const result = await policy.execute((): string => {
            throw new Error('ExceptionOne');
        });

        expect(fallbacksExecuted).to.equal(3);
        expect(result).to.equal('Diplomatiq is cool.');
    });

    it('should fallback on any exception until a result is returned', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;

        policy.reactOnException((): boolean => true);

        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            throw new Error('ExceptionTwo');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            throw new Error('ExceptionThree');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });

        const result = await policy.execute((): string => {
            throw new Error('ExceptionOne');
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
    });

    it('should throw FallbackChainExhaustedException if falling back on result and there are no (more) links on the fallback chain', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnResult((): boolean => true);

        try {
            await policy.execute((): string => {
                return 'Diplomatiq is cool.';
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof FallbackChainExhaustedException).to.be.true;
        }
    });

    it('should throw FallbackChainExhaustedException if falling back on exception and there are no (more) links on the fallback chain', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();
        policy.reactOnException((): boolean => true);

        try {
            await policy.execute((): string => {
                throw new Error('TestException');
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect(ex instanceof FallbackChainExhaustedException).to.be.true;
        }
    });

    it('should run onFallbackFn with result filled on fallback, before the fallback', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted);

            onFallbackExecuted++;
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });

    it('should run onFallbackFn with result filled on fallback, every time before a fallback', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted);
            onFallbackExecuted++;
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
        expect(onFallbackExecuted).to.equal(3);
    });

    it('should run onFallbackFn with error filled on fallback, before the fallback', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');

            expect(onFallbackExecuted).to.equal(fallbacksExecuted);

            onFallbackExecuted++;
        });

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });

    it('should run onFallbackFn with error filled on fallback, every time before a fallback', async (): Promise<
        void
    > => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnException((e: unknown): boolean => (e as Error).message === 'TestException');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            throw new Error('TestException');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            throw new Error('TestException');
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal(undefined);
            expect((error as Error).message).to.equal('TestException');

            expect(onFallbackExecuted).to.equal(fallbacksExecuted);
            onFallbackExecuted++;
        });

        const result = await policy.execute((): string => {
            throw new Error('TestException');
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
        expect(onFallbackExecuted).to.equal(3);
    });

    it('should not run onFallbackFn if no fallback happened', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let onFallbackExecuted = 0;

        policy.onFallback((): void => {
            onFallbackExecuted++;
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(onFallbackExecuted).to.equal(0);
    });

    it('should await an asynchronous onFallbackFn before fallback', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback(
            async (
                result: string | undefined,
                error: unknown | undefined,
                // eslint-disable-next-line @typescript-eslint/require-await
            ): Promise<void> => {
                expect(result).to.equal('Diplomatiq is bad.');
                expect(error).to.equal(undefined);

                expect(onFallbackExecuted).to.equal(fallbacksExecuted);
                onFallbackExecuted++;
            },
        );

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(1);
        expect(onFallbackExecuted).to.equal(1);
    });

    it('should run multiple synchronous onFallbackFns sequentially on fallback', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3);
            onFallbackExecuted++;
            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 1);
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 1);
            onFallbackExecuted++;
            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 2);
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 2);
            onFallbackExecuted++;
            expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 3);
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
        expect(onFallbackExecuted).to.equal(9);
    });

    it('should run multiple asynchronous onFallbackFns sequentially on fallback', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (result: string | undefined, error: unknown | undefined): Promise<void> => {
                expect(result).to.equal('Diplomatiq is bad.');
                expect(error).to.equal(undefined);

                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3);
                onFallbackExecuted++;
                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 1);
            },
        );
        policy.onFallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (result: string | undefined, error: unknown | undefined): Promise<void> => {
                expect(result).to.equal('Diplomatiq is bad.');
                expect(error).to.equal(undefined);

                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 1);
                onFallbackExecuted++;
                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 2);
            },
        );
        policy.onFallback(
            // eslint-disable-next-line @typescript-eslint/require-await
            async (result: string | undefined, error: unknown | undefined): Promise<void> => {
                expect(result).to.equal('Diplomatiq is bad.');
                expect(error).to.equal(undefined);

                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 2);
                onFallbackExecuted++;
                expect(onFallbackExecuted).to.equal(fallbacksExecuted * 3 + 3);
            },
        );

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(fallbacksExecuted).to.equal(3);
        expect(onFallbackExecuted).to.equal(9);
    });

    it('should run onFinallyFn after all execution and fallbacks if fallback happened', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let fallbacksExecuted = 0;
        let onFallbackExecuted = 0;
        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(0);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(1);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(1);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(2);
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            expect(fallbacksExecuted).to.equal(2);
            fallbacksExecuted++;
            expect(fallbacksExecuted).to.equal(3);
            return 'Diplomatiq is cool.';
        });
        policy.onFallback((result: string | undefined, error: unknown | undefined): void => {
            expect(result).to.equal('Diplomatiq is bad.');
            expect(error).to.equal(undefined);

            expect(onFallbackExecuted).to.equal(fallbacksExecuted);
            onFallbackExecuted++;
        });
        policy.onFinally((): void => {
            onFinallyExecuted++;

            expect(fallbacksExecuted).to.equal(3);
            expect(onFallbackExecuted).to.equal(3);
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');

        expect(fallbacksExecuted).to.equal(3);
        expect(onFallbackExecuted).to.equal(3);
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run onFinallyFn after the execution if no fallback happened', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let onFinallyExecuted = 0;

        policy.onFinally((): void => {
            onFinallyExecuted++;
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should run multiple synchronous onFinallyFns sequentially', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let onFinallyExecuted = 0;

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

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run multiple asynchronous onFinallyFns sequentially', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let onFinallyExecuted = 0;

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

        const result = await policy.execute((): string => {
            return 'Diplomatiq is cool.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(onFinallyExecuted).to.equal(3);
    });

    it('should run onFinallyFn once, regardless of how many link the fallback chain has', async (): Promise<void> => {
        const policy = new FallbackPolicy<string>();

        let onFinallyExecuted = 0;

        policy.reactOnResult((r: string): boolean => r === 'Diplomatiq is bad.');
        policy.fallback((): string => {
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            return 'Diplomatiq is bad.';
        });
        policy.fallback((): string => {
            return 'Diplomatiq is cool.';
        });
        policy.onFinally((): void => {
            onFinallyExecuted++;
        });

        const result = await policy.execute((): string => {
            return 'Diplomatiq is bad.';
        });

        expect(result).to.equal('Diplomatiq is cool.');
        expect(onFinallyExecuted).to.equal(1);
    });

    it('should not allow to set fallback during execution', (): void => {
        const policy = new FallbackPolicy();
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.fallback((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to set onFallbackFns during execution', (): void => {
        const policy = new FallbackPolicy();
        policy.execute(
            async (): Promise<void> => {
                await new Promise((): void => {
                    // will not resolve
                });
            },
        );

        try {
            policy.onFallback((): void => {
                // empty
            });
            expect.fail('did not throw');
        } catch (ex) {
            expect((ex as Error).message).to.equal('cannot modify policy during execution');
        }
    });

    it('should not allow to add onFinallyFns during execution', (): void => {
        const policy = new FallbackPolicy();
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
        const policy = new FallbackPolicy<void>();

        const attemptPolicyModification = (expectFailure: boolean): void => {
            try {
                policy.fallback((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect((ex as Error).message).to.equal('cannot modify policy during execution');
            }

            try {
                policy.onFallback((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect((ex as Error).message).to.equal('cannot modify policy during execution');
            }

            try {
                policy.onFinally((): void => {
                    // empty
                });
                if (expectFailure) {
                    expect.fail('did not throw');
                }
            } catch (ex) {
                expect((ex as Error).message).to.equal('cannot modify policy during execution');
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
});
