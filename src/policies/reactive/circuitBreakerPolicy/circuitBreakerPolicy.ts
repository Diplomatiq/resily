import { ReactivePolicy } from '../reactivePolicy';
import { BrokenCircuitException } from './brokenCircuitException';
import { CircuitState } from './circuitState';
import { IsolatedCircuitException } from './isolatedCircuitException';
import { OnAttemptingCloseFn } from './onAttemptingCloseFn';
import { OnCloseFn } from './onCloseFn';
import { OnIsolateFn } from './onIsolateFn';
import { OnOpenFn } from './onOpenFn';

export class CircuitBreakerPolicy<ResultType> extends ReactivePolicy<ResultType> {
    private numberOfConsecutiveReactionsBeforeCircuitBreak = 1;
    private durationOfCircuitBreakMs = 1000;
    private readonly onOpenFns: OnOpenFn[] = [];
    private readonly onCloseFns: OnCloseFn[] = [];
    private readonly onAttemptingCloseFns: OnAttemptingCloseFn[] = [];
    private readonly onIsolateFns: OnIsolateFn[] = [];

    private state: CircuitState = 'Closed';
    private lastStateTransition: number = Date.now();
    private consecutiveReactionCounter = 0;

    public breakAfter(numberOfConsecutiveReactionsBeforeCircuitBreak: number): void {
        if (!Number.isInteger(numberOfConsecutiveReactionsBeforeCircuitBreak)) {
            throw new Error('numberOfConsecutiveReactionsBeforeCircuitBreak must be integer');
        }

        if (numberOfConsecutiveReactionsBeforeCircuitBreak <= 0) {
            throw new Error('numberOfConsecutiveReactionsBeforeCircuitBreak must be greater than 0');
        }

        if (!Number.isSafeInteger(numberOfConsecutiveReactionsBeforeCircuitBreak)) {
            throw new Error('numberOfConsecutiveReactionsBeforeCircuitBreak must be less than or equal to 2^53 - 1');
        }

        this.throwForPolicyModificationIfExecuting();

        this.numberOfConsecutiveReactionsBeforeCircuitBreak = numberOfConsecutiveReactionsBeforeCircuitBreak;
    }

    public breakFor(durationOfCircuitBreakMs: number): void {
        if (!Number.isInteger(durationOfCircuitBreakMs)) {
            throw new Error('durationOfCircuitBreakMs must be integer');
        }

        if (durationOfCircuitBreakMs <= 0) {
            throw new Error('durationOfCircuitBreakMs must be greater than 0');
        }

        if (!Number.isSafeInteger(durationOfCircuitBreakMs)) {
            throw new Error('durationOfCircuitBreakMs must be less than or equal to 2^53 - 1');
        }

        this.throwForPolicyModificationIfExecuting();

        this.durationOfCircuitBreakMs = durationOfCircuitBreakMs;
    }

    public async isolate(): Promise<void> {
        await this.transitionState('Isolated');
    }

    public async reset(): Promise<void> {
        if (this.state !== 'Isolated') {
            throw new Error('cannot reset if not in Isolated state');
        }

        await this.transitionState('Closed');
    }

    public getCircuitState(): CircuitState {
        return this.state;
    }

    public onClose(onCloseFn: OnCloseFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onCloseFns.push(onCloseFn);
    }

    public onOpen(onOpenFn: OnOpenFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onOpenFns.push(onOpenFn);
    }

    public onAttemptingClose(onAttemptingCloseFn: OnAttemptingCloseFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onAttemptingCloseFns.push(onAttemptingCloseFn);
    }

    public onIsolate(onIsolateFn: OnIsolateFn): void {
        this.throwForPolicyModificationIfExecuting();

        this.onIsolateFns.push(onIsolateFn);
    }

    protected async policyExecutorImpl(fn: () => ResultType | Promise<ResultType>): Promise<ResultType> {
        await this.attemptClosingIfShould();

        if (this.state === 'Open') {
            throw new BrokenCircuitException();
        }

        if (this.state === 'Isolated') {
            throw new IsolatedCircuitException();
        }

        try {
            const result = await fn();

            const isReactiveToResult = await this.isReactiveToResult(result);
            if (!isReactiveToResult) {
                this.consecutiveReactionCounter = 0;

                if (this.state === 'AttemptingClose') {
                    await this.transitionState('Closed');
                }

                return result;
            }

            if (this.state === 'AttemptingClose') {
                await this.transitionState('Open');
            }

            if (this.state === 'Closed') {
                this.consecutiveReactionCounter++;
                if (this.consecutiveReactionCounter >= this.numberOfConsecutiveReactionsBeforeCircuitBreak) {
                    await this.transitionState('Open');
                }
            }

            return result;
        } catch (ex) {
            const isReactiveToException = await this.isReactiveToException(ex);
            if (!isReactiveToException) {
                this.consecutiveReactionCounter = 0;

                if (this.state === 'AttemptingClose') {
                    await this.transitionState('Closed');
                }

                throw ex;
            }

            if (this.state === 'AttemptingClose') {
                await this.transitionState('Open');
            }

            if (this.state === 'Closed') {
                this.consecutiveReactionCounter++;
                if (this.consecutiveReactionCounter >= this.numberOfConsecutiveReactionsBeforeCircuitBreak) {
                    await this.transitionState('Open');
                }
            }

            throw ex;
        }
    }

    private async attemptClosingIfShould(): Promise<void> {
        if (this.state !== 'Open') {
            return;
        }

        const shouldAttemptClosing = Date.now() >= this.lastStateTransition + this.durationOfCircuitBreakMs;
        if (shouldAttemptClosing) {
            await this.transitionState('AttemptingClose');
        }
    }

    private async transitionState(newState: CircuitState): Promise<void> {
        switch (newState) {
            case 'Closed': {
                this.validateTransition(new Set(['AttemptingClose', 'Isolated']));
                for (const onCloseFn of this.onCloseFns) {
                    try {
                        await onCloseFn();
                    } catch (ex) {
                        // ignored
                    }
                }
                break;
            }

            case 'Open': {
                this.validateTransition(new Set(['Closed', 'AttemptingClose']));
                for (const onOpenFn of this.onOpenFns) {
                    try {
                        await onOpenFn();
                    } catch (ex) {
                        // ignored
                    }
                }
                break;
            }

            case 'AttemptingClose': {
                this.validateTransition(new Set(['Open']));
                for (const onAttemptingCloseFn of this.onAttemptingCloseFns) {
                    try {
                        await onAttemptingCloseFn();
                    } catch (ex) {
                        // ignored
                    }
                }
                break;
            }

            case 'Isolated': {
                this.validateTransition(new Set(['Closed', 'Open', 'AttemptingClose']));
                for (const onIsolateFn of this.onIsolateFns) {
                    try {
                        await onIsolateFn();
                    } catch (ex) {
                        // ignored
                    }
                }
                break;
            }
        }

        this.state = newState;
        this.lastStateTransition = Date.now();
    }

    private validateTransition(validFrom: Set<CircuitState>): void {
        if (!validFrom.has(this.state)) {
            throw new Error('invalid transition');
        }
    }
}
