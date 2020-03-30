# resily

Resily is a TypeScript resilience and transient-fault-handling library that allows developers to express policies such as Retry, Fallback, Circuit Breaker, Timeout, Bulkhead Isolation, and Cache. Inspired by [App-vNext/Polly](https://github.com/App-vNext/Polly).

<p>
<a href="https://github.com/Diplomatiq/resily/actions?query=workflow%3ACI" target="_blank" style="text-decoration: none;">
  <img src="https://github.com/Diplomatiq/resily/workflows/CI/badge.svg" alt="build status">
</a>

<a href="https://github.com/Diplomatiq/resily" target="_blank" style="text-decoration: none;">
  <img src="https://img.shields.io/github/languages/top/Diplomatiq/resily.svg" alt="languages used">
</a>

<a href="https://www.npmjs.com/package/@diplomatiq/resily" target="_blank" style="text-decoration: none;">
  <img src="https://img.shields.io/npm/dt/@diplomatiq/resily.svg" alt="downloads from npm">
</a>

<a href="https://www.npmjs.com/package/@diplomatiq/resily" target="_blank" style="text-decoration: none;">
  <img src="https://img.shields.io/npm/v/@diplomatiq/resily.svg" alt="latest released version on npm">
</a>

<a href="https://github.com/Diplomatiq/resily/blob/master/LICENSE" target="_blank" style="text-decoration: none;">
  <img src="https://img.shields.io/npm/l/@diplomatiq/resily.svg" alt="license">
</a>
</p>

<p>
<a href="https://sonarcloud.io/dashboard?id=Diplomatiq_resily" target="_blank" style="text-decoration: none;">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=Diplomatiq_resily&metric=alert_status" alt="Quality Gate">
</a>

<a href="https://sonarcloud.io/dashboard?id=Diplomatiq_resily" target="_blank" style="text-decoration: none;">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=Diplomatiq_resily&metric=coverage" alt="Coverage">
</a>

<a href="https://sonarcloud.io/dashboard?id=Diplomatiq_resily" target="_blank" style="text-decoration: none;">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=Diplomatiq_resily&metric=sqale_rating" alt="Maintainability Rating">
</a>

<a href="https://sonarcloud.io/dashboard?id=Diplomatiq_resily" target="_blank" style="text-decoration: none;">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=Diplomatiq_resily&metric=reliability_rating" alt="Reliability Rating">
</a>

<a href="https://sonarcloud.io/dashboard?id=Diplomatiq_resily" target="_blank" style="text-decoration: none;">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=Diplomatiq_resily&metric=security_rating" alt="Security Rating">
</a>

<a href="https://github.com/Diplomatiq/resily/pulls" target="_blank" style="text-decoration: none;">
  <img src="https://api.dependabot.com/badges/status?host=github&repo=Diplomatiq/resily" alt="Dependabot">
</a>
</p>

<p>
<a href="https://gitter.im/Diplomatiq/resily" target="_blank" style="text-decoration: none;">
  <img src="https://badges.gitter.im/Diplomatiq/resily.svg" alt="Gitter">
</a>
</p>

---

## Installation

Being an npm package, you can install resily with the following command:

```bash
npm install -P @diplomatiq/resily
```

## Testing

Run tests with the following:

```bash
npm test
```

## Usage

_Note: This package is built as an ES6 package. You will not be able to use `require()`._

After installation, you can import policies and other helper classes into your project, then wrap your code into one or more policies.

Every policy extends the abstract `Policy` class, which has an `execute` method. Your code wrapped into a policy gets executed when you invoke `execute`. The `execute` method is asynchronous, so it returns a `Promise` resolving with the return value of the executed method (or rejecting with an exception thrown by the method).

The wrapped method can be synchronous or asynchronous, it will be awaited in either case:

```typescript
async function main() {
    const policy = … // any policy

    // configure the policy before executing code, see below

    // then execute some code wrapped into the policy
    // execute is async, so it returns a Promise
    const result = await policy.execute(
        // the wrapped method can be sync or async
        async () => {
            // the executed code
            return 5;
        },
    );

    // the value of result is 5
}
```

See concrete usage examples below at the policies' documentation.

## Policies

Resily offers **reactive** and **proactive** policies:

-   A **reactive** policy executes the wrapped method, then reacts to the outcome (which in practice is the result of or an exception thrown by the executed method) by acting as specified in the policy itself. Examples for reactive policies include retry, fallback, circuit-breaker.
-   A **proactive** policy executes the wrapped method, then acts on its own as specified in the policy itself, regardless of the outcome of the executed code. Examples for proactive policies include timeout, bulkhead isolation, cache.

#### Reactive policies summary

| Policy                                            | What does it claim?                                                                                                                                                 | How does it work?                                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**RetryPolicy**](#retrypolicy)                   | Many faults are transient and will not occur again after a delay.                                                                                                   | Allows configuring automatic retries on specified conditions.                                                                                         |
| [**FallbackPolicy**](#fallbackpolicy)             | Failures happen, and we can prepare for them.                                                                                                                       | Allows configuring substitute values or automated fallback actions.                                                                                   |
| [**CircuitBreakerPolicy**](#circuitbreakerpolicy) | Systems faulting under heavy load can recover easier without even more load — in these cases it's better to fail fast than to keep callers on hold for a long time. | If there are more consecutive faulty responses than the configured number, it breaks the circuit (blocks the executions) for a specified time period. |

#### Proactive policies summary

| Policy                                                  | What does it claim?                                               | How does it work?                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [**TimeoutPolicy**](#timeoutpolicy)                     | After some time, it is unlikely that the call will be successful. | Ensures the caller does not have to wait more than the specified timeout.                               |
| [**BulkheadIsolationPolicy**](#bulkheadisolationpolicy) | Too many concurrent calls can overload a resource.                | Limits the number of concurrently executed actions as specified.                                        |
| [**NopPolicy**](#noppolicy)                             | Does not claim anything.                                          | Executes the wrapped method, and returns its result or throws its exceptions, without any intervention. |

### Reactive policies

Every reactive policy extends the `ReactivePolicy` class, which means they can be configured with predicates to react on specific results and/or exceptions:

```typescript
const policy = … // any reactive policy

// if the executed code returns 5, the policy will react
policy.reactOnResult(r => r === 5);

// will react
await policy.execute(() => 5);

// will react
await policy.execute(async () => 5);

// will not react
await policy.execute(() => 2);

// will not react
await policy.execute(async () => 2);
```

```typescript
const policy = … // any reactive policy

// if the executed code throws a ConcurrentAccessException, the policy will react
policy.reactOnException(e => e instanceof ConcurrentAccessException);

// will react
await policy.execute(() => {
    throw new ConcurrentAccessException();
});

// will react
await policy.execute(async () => {
    throw new ConcurrentAccessException();
});

// will not react
await policy.execute(() => {
    throw new OutOfRangeException();
});

// will not react
await policy.execute(async () => {
    throw new OutOfRangeException();
});
```

If the policy is configured to react on multiple kinds of results or exceptions, it will react if any of them occurs:

```typescript
const policy = … // any reactive policy

policy.reactOnResult(r => r === 5);
policy.reactOnResult(r => r === 7);
policy.reactOnException(e => e instanceof ConcurrentAccessException);
policy.reactOnException(e => e instanceof InvalidArgumentException);

// will react
await policy.execute(() => 5);

// will react
await policy.execute(async () => 5);

// will react
await policy.execute(() => 7);

// will react
await policy.execute(async () => 7);

// will react
await policy.execute(() => {
    throw new ConcurrentAccessException();
});

// will react
await policy.execute(async () => {
    throw new ConcurrentAccessException();
});

// will react
await policy.execute(() => {
    throw new InvalidArgumentException();
});

// will react
await policy.execute(async () => {
    throw new InvalidArgumentException();
});

// will not react
await policy.execute(() => 2);

// will not react
await policy.execute(async () => 2);

// will not react
await policy.execute(() => {
    throw new OutOfRangeException();
});

// will not react
await policy.execute(async () => {
    throw new OutOfRangeException();
});
```

You can configure the policy to react on any result and/or to any exception:

```typescript
const policy = … // any reactive policy

// react on any result
policy.reactOnResult(() => true);

// react on any exception
policy.reactOnException(() => true);
```

#### RetryPolicy

`RetryPolicy` claims that many faults are transient and will not occur again after a delay. It allows configuring automatic retries on specified conditions.

Since `RetryPolicy` is a reactive policy, you need to configure the policy to retry the execution on specific results or exceptions with `reactOnResult` and `reactOnException`. See the [Reactive policies](#reactive-policies) section for details.

Configure how many retries you need or retry forever:

```typescript
import { RetryPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new RetryPolicy<string>();

// retry until the result/exception is reactive, but maximum 3 times
policy.retryCount(3);

// this overwrites the previous value
policy.retryCount(5);

// this also overwrites the previous value
// this is the same as policy.retryCount(Number.POSITIVE_INFINITY)
policy.retryForever();
```

Perform certain actions before retrying:

```typescript
import { RetryPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new RetryPolicy<string>();

policy.onRetry(
    // onRetryFns can be sync or async, they will be awaited
    async (result, error, currentRetryCount) => {
        // this code will be executed before the currentRetryCount-th retry occurs
        // result is undefined if reacting upon a thrown error
        // error is undefined if reacting upon a result
    },
);

// you can set multiple onRetryFns, they will run sequentially
policy.onRetry(async () => {
    // this will be awaited first
});
policy.onRetry(async () => {
    // then this will be awaited
});

// errors thrown by an onRetryFn will be caught and ignored
policy.onRetry(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

Wait for the specified number of milliseconds before retrying:

```typescript
import { RetryPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new RetryPolicy<string>();

// wait for 100 ms before each retry
policy.waitBeforeRetry(() => 100);

// this overwrites the previous backoff strategy
// wait for 100 ms before the first retry, 200 ms before the second retry, etc.
policy.waitBeforeRetry(currentRetryCount => currentRetryCount * 100);
```

The waiting happens _before_ the execution of onRetryFns.

Although you can code any kind of backoff, there are also predefined, ready-to-use backoff strategies:

```typescript
import { BackoffStrategyFactory, RetryPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new RetryPolicy<string>();

// wait for 100 ms before each retry
// 100 100 100 100 100 …
policy.waitBeforeRetry(BackoffStrategyFactory.constantBackoff(100));

// retry immediately for the first time, then wait for 100 ms before each retry
// 0 100 100 100 100 …
policy.waitBeforeRetry(BackoffStrategyFactory.constantBackoff(100, true));

// wait for (currentRetryCount * 100) ms before each retry
// 100 200 300 400 500 …
policy.waitBeforeRetry(BackoffStrategyFactory.linearBackoff(100));

// retry immediately for the first time, then wait for ((currentRetryCount - 1) * 100) ms before each retry
// 0 100 200 300 400 …
policy.waitBeforeRetry(BackoffStrategyFactory.linearBackoff(100, true));

// wait for (100 * 2 ** (currentRetryCount - 1)) ms before each retry
// 100 200 400 800 1600 …
policy.waitBeforeRetry(BackoffStrategyFactory.exponentialBackoff(100));

// retry immediately for the first time, then wait for (100 * 2 ** (currentRetryCount - 2)) ms before each retry
// 0 100 200 400 800 …
policy.waitBeforeRetry(BackoffStrategyFactory.exponentialBackoff(100, true));

// wait for (100 * 3 ** (currentRetryCount - 1)) ms before each retry
// 100 300 900 2700 8100 …
policy.waitBeforeRetry(BackoffStrategyFactory.exponentialBackoff(100, false, 3));

// retry immediately for the first time, then wait for (100 * 3 ** (currentRetryCount - 2)) ms before each retry
// 0 100 300 900 2700 …
policy.waitBeforeRetry(BackoffStrategyFactory.exponentialBackoff(100, true, 3));

// wait for a [random between 1-100, inclusive] ms before each retry
policy.waitBeforeRetry(BackoffStrategyFactory.jitteredBackoff(1, 100));

// retry immediately for the first time, then wait for a [random between 1-100, inclusive] ms before each retry
policy.waitBeforeRetry(BackoffStrategyFactory.jitteredBackoff(1, 100, true));
```

For using `jitteredBackoff` in Node.js environments, you will need to inject a Node.js-based entropy source into the default RandomGenerator ([@diplomatiq/crypto-random](https://github.com/Diplomatiq/crypto-random) requires `window.crypto.getRandomValues` to be available by default). Create the following in your project:

```typescript
import { EntropyProvider, UnsignedTypedArray } from '@diplomatiq/crypto-random';
import { randomFill } from 'crypto';

export class NodeJsEntropyProvider implements EntropyProvider {
    public async getRandomValues<T extends UnsignedTypedArray>(array: T): Promise<T> {
        return new Promise<T>((resolve, reject): void => {
            randomFill(array, (error: Error | null, array: T): void => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve(array);
            });
        });
    }
}
```

Then use it as follows:

```typescript
import { RandomGenerator } from '@diplomatiq/crypto-random';
import { NodeJsEntropyProvider } from './nodeJsEntropyProvider';

const entropyProvider = new NodeJsEntropyProvider();
const randomGenerator = new RandomGenerator(entropyProvider);

const jitteredBackoff = BackoffStrategyFactory.jitteredBackoff(1, 100, true, randomGenerator);
```

Perform certain actions after the execution and all retries finished:

```typescript
import { RetryPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new RetryPolicy<string>();

policy.onFinally(
    // onFinallyFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onFinallyFns, they will run sequentially
policy.onFinally(async () => {
    // this will be awaited first
});
policy.onFinally(async () => {
    // then this will be awaited
});

// errors thrown by an onFinallyFn will be caught and ignored
policy.onFinally(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

#### FallbackPolicy

`FallbackPolicy` claims that failures happen, and we can prepare for them. It allows configuring substitute values or automated fallback actions.

Since `FallbackPolicy` is a reactive policy, you need to configure the policy to fallback along its fallback chain on specific results or exceptions with `reactOnResult` and `reactOnException`. See the [Reactive policies](#reactive-policies) section for details.

Configure the fallback chain:

```typescript
import { FallbackPolicy } from '@diplomatiq/resily';

// the wrapped method and its fallbacks are supposed to return a string
const policy = new FallbackPolicy<string>();

// if the wrapped method's result/exception is reactive, configure a fallback method onto the fallback chain
policy.fallback(
    // the fallback methods can be sync or async, they will be awaited
    () => {
        // do something
    },
);

// if the previous fallback method's result/exception is reactive, configure another fallback onto the fallback chain
policy.fallback(
    // the fallback methods can be sync or async, they will be awaited
    async () => {
        // do something
    },
);

// you can configure any number of fallback methods onto the fallback chain
```

If there are no more elements on the fallback chain but the last result/exception is still reactive — meaning there are no more fallbacks when needed —, a `FallbackChainExhaustedException` is thrown.

Perform certain actions before the fallback:

```typescript
import { FallbackPolicy } from '@diplomatiq/resily';

// the wrapped method and its fallbacks are supposed to return a string
const policy = new FallbackPolicy<string>();

policy.onFallback(
    // onFallbackFns can be sync or async, they will be awaited
    async (result, error) => {
        // result is undefined if reacting upon a thrown error
        // error is undefined if reacting upon a result
    },
);

// you can set multiple onFallbackFns, they will run sequentially
policy.onFallback(async () => {
    // this will be awaited first
});
policy.onFallback(async () => {
    // then this will be awaited
});

// errors thrown by an onFallbackFn will be caught and ignored
policy.onFallback(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

Perform certain actions after the execution and all fallbacks finished:

```typescript
import { FallbackPolicy } from '@diplomatiq/resily';

// the wrapped method and its fallbacks are supposed to return a string
const policy = new FallbackPolicy<string>();

policy.onFinally(
    // onFinallyFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onFinallyFns, they will run sequentially
policy.onFinally(async () => {
    // this will be awaited first
});
policy.onFinally(async () => {
    // then this will be awaited
});

// errors thrown by an onFinallyFn will be caught and ignored
policy.onFinally(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

#### CircuitBreakerPolicy

`CircuitBreakerPolicy` claims that systems faulting under heavy load can recover easier without even more load — in these cases it's better to fail fast than to keep callers on hold for a long time.

If there are more consecutive faulty responses than the configured number, it breaks the circuit (blocks the executions) for a specified time period.

Since `CircuitBreakerPolicy` is a reactive policy, you need to configure the policy to break the circuit on specific results or exceptions with `reactOnResult` and `reactOnException`. See the [Reactive policies](#reactive-policies) section for details.

The `CircuitBreakerPolicy` has 4 states, and works as follows:

`Closed`

-   This is the initial state.
-   When closed, the circuit allows executions, while measuring reactive results and exceptions. All results (reactive or not) are returned and all exceptions (reactive or not) are rethrown.
-   When encountering altogether `numberOfConsecutiveReactionsBeforeCircuitBreak` reactive results or exceptions _consecutively_, the circuit transitions to `Open` state, meaning the circuit is broken.

`Open`

-   While the circuit is in `Open` state, no action wrapped into the policy gets executed. Every call will fail fast with a `BrokenCircuitException`.
-   The circuit remains open for the specified duration. After the duration elapses, the subsequent execution call transitions the circuit to `AttemptingClose` state.

`AttemptingClose`

-   As the name implies, this state is an attempt to close the circuit.
-   This is a temporary state of the circuit, existing only between the subsequent execution call to the circuit after the break duration elapsed in `Open` state, and the actual execution of the wrapped method.
-   The next circuit state is determined by the result or exception produced by the executed method.

    -   If the result or exception is reactive to the policy, the circuit transitions back to `Open` state for the specified circuit break duration.
    -   If the result or exception is not reactive to the policy, the circuit transitions to `Closed` state.

`Isolated`

-   You can manually break the circuit by calling `policy.isolate()`, from any state. This transitions the circuit to `Isolated` state.
-   While the circuit is in `Isolated` state, no action wrapped into the policy gets executed. Every call will fail fast with an `IsolatedCircuitException`.
-   The circuit remains in `Isolated` state until `policy.reset()` is called.

Configure how many consecutive reactions should break the circuit:

```typescript
import { CircuitBreakerPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new CircuitBreakerPolicy<string>();

// break the circuit after encountering 3 reactive results/exceptions consecutively
policy.breakAfter(3);

// this overwrites the previous value
policy.breakAfter(5);
```

Configure how long the circuit should be broken:

```typescript
import { CircuitBreakerPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new CircuitBreakerPolicy<string>();

// break the circuit for 5000 ms
policy.breakFor(5000);

// this overwrites the previous value
policy.breakFor(20000);
```

Manage the circuit manually:

```typescript
import { CircuitBreakerPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new CircuitBreakerPolicy<string>();

// break the circuit manually - it will be open indefinitely
await policy.isolate();

// get the circuit's current state
const state = policy.getCircuitState();
// 'Closed' | 'Open' | 'AttemptingClose' | 'Isolated'

// reset the circuit after isolating - it will close
if (state === 'Isolated') {
    await policy.reset();
}
```

Perform actions on state transitions:

```typescript
import { CircuitBreakerPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new CircuitBreakerPolicy<string>();
```

```typescript
policy.onClose(
    // onCloseFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onCloseFns, they will run sequentially
policy.onClose(async () => {
    // this will be awaited first
});
policy.onClose(async () => {
    // then this will be awaited
});

// errors thrown by an onCloseFn will be caught and ignored
policy.onClose(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

```typescript
policy.onOpen(
    // onOpenFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onOpenFns, they will run sequentially
policy.onOpen(async () => {
    // this will be awaited first
});
policy.onOpen(async () => {
    // then this will be awaited
});

// errors thrown by an onOpenFn will be caught and ignored
policy.onOpen(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

```typescript
policy.onAttemptingClose(
    // onAttemptingCloseFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onAttemptingCloseFns, they will run sequentially
policy.onAttemptingClose(async () => {
    // this will be awaited first
});
policy.onAttemptingClose(async () => {
    // then this will be awaited
});

// errors thrown by an onAttemptingCloseFn will be caught and ignored
policy.onAttemptingClose(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

```typescript
policy.onIsolate(
    // onIsolateFns can be sync or async, they will be awaited
    async () => {},
);

// you can set multiple onIsolateFns, they will run sequentially
policy.onIsolate(async () => {
    // this will be awaited first
});
policy.onIsolate(async () => {
    // then this will be awaited
});

// errors thrown by an onIsolateFn will be caught and ignored
policy.onIsolate(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

### Proactive policies

Every proactive policy extends the `ProactivePolicy` class.

#### TimeoutPolicy

`TimeoutPolicy` claims that after some time, it is unlikely the call will be successful. It ensures the caller does not have to wait more than the specified timeout.

Only asynchronous methods can be executed within a `TimeoutPolicy`, or else no timeout happens. `TimeoutPolicy` is implemented with `Promise.race()`, racing the promise returned by the executed method (`executionPromise`) with a promise that is rejected after the specified time elapses (`timeoutPromise`). If the executed method is not asynchronous (i.e. it does not have at least one point to pause its execution at), no timeout will happen even if the execution takes longer than the specified timeout duration, since there is no point in time for taking the control out from the executed method's hands to reject the `timeoutPromise`.

The executed method is fully executed to its end (unless it throws an exception), regardless of whether a timeout has occured or not. `TimeoutPolicy` ensures that the caller does not have to wait more than the specified timeout, but it does neither cancel nor abort\* the execution of the method. This means that if the executed method has side effects, these side effects can occur even after the timeout happened.

\*TypeScript/JavaScript has no _generic_ way of canceling or aborting an executing method, either synchronous or asynchronous. `TimeoutPolicy` runs arbitrary user-provided code: it cannot be assumed the code is prepared in any way (e.g. it has cancel points). The provided code _could_ be executed in a separate worker thread so it can be aborted instantaneously by terminating the worker, but run-time compiling a worker from user-provided code is ugly and error-prone.

On timeout, the promise returned by the policy's `execute` method is rejected with a `TimeoutException`:

```typescript
import { TimeoutException, TimeoutPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new TimeoutPolicy<string>();

try {
    const result = await policy.execute(async () => {
        // the executed code
    });
} catch (ex) {
    if (ex instanceof TimeoutException) {
        // the operation timed out
    } else {
        // the executed method thrown an exception
    }
}
```

Configure how long the waiting period should be:

```typescript
import { TimeoutPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new TimeoutPolicy<string>();
policy.timeoutAfter(1000); // timeout after 1000 ms
```

Perform certain actions on timeout:

```typescript
import { TimeoutPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new TimeoutPolicy<string>();
policy.onTimeout(
    // onTimeoutFns can be sync or async, they will be awaited
    async timedOutAfterMs => {
        // the policy was configured to timeout after timedOutAfterMs
    },
);

// you can set multiple onTimeoutFns, they will run sequentially
policy.onTimeout(async () => {
    // this will be awaited first
});
policy.onTimeout(async () => {
    // then this will be awaited
});

// errors thrown by an onTimeoutFn will be caught and ignored
policy.onTimeout(() => {
    // throwing an error has no effect outside the method
    throw new Error();
});
```

Throwing a `TimeoutException` from the executed method is not a timeout, therefore it does not trigger running `onTimeout` functions:

```typescript
import { TimeoutException, TimeoutPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new TimeoutPolicy<string>();

let onTimeoutRan = false;
policy.onTimeout(() => {
    onTimeoutRan = true;
});

try {
    await policy.execute(async () => {
        throw new TimeoutException();
    });
} catch (ex) {
    // ex is a TimeoutException (thrown by the executed method)
    const isTimeoutException = ex instanceof TimeoutException; // true
}

// onTimeoutRan is false
```

#### BulkheadIsolationPolicy

`BulkheadIsolationPolicy` claims that too many concurrent calls can overload a resource. It limits the number of concurrently executed actions as specified.

Method calls executed via the policy are placed into a size-limited bulkhead compartment, limiting the maximum number of concurrent executions.

If the bulkhead compartment is full — meaning the maximum number of concurrent executions is reached —, additional calls can be queued up, ready to be executed whenever a place falls vacant in the bulkhead compartment (i.e. an execution finishes). Queuing up these calls ensures that the resource protected by the policy is always at maximum utilization, while limiting the number of concurrent actions ensures that the resource is not overloaded. The queue is a simple FIFO buffer.

When the policy's `execute` method is invoked with a method to be executed, the policy's operation can be described as follows:

-   `(1)` If there is an execution slot available in the bulkhead compartment, execute the method immediately.

-   `(2)` Else if there is still space in the queue, enqueue the execution intent of the method — without actually executing the method —, then wait asynchronously until the method can be executed.

    An execution intent gets dequeued — and its corresponding method gets executed — each time an execution slot becomes available in the bulkhead compartment.

-   `(3)` Else throw a `BulkheadCompartmentRejectedException`.

From the caller's point of view, this is all transparent: the promise returned by the `execute` method is

-   either eventually resolved with the return value of the wrapped method (cases `(1)` and `(2)`),
-   or eventually rejected with an exception thrown by the wrapped method (cases `(1)` and `(2)`),
-   or rejected with a `BulkheadCompartmentRejectedException` (case `(3)`).

Configure the size of the bulkhead compartment:

```typescript
import { BulkheadIsolationPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new BulkheadIsolationPolicy<string>();

// allow maximum 3 concurrent executions
policy.maxConcurrency(3);

// this overwrites the previous value
policy.maxConcurrency(5);
```

Configure the size of the queue:

```typescript
import { BulkheadIsolationPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new BulkheadIsolationPolicy<string>();

// allow maximum 3 queued actions
policy.maxQueuedActions(3);

// this overwrites the previous value
policy.maxQueuedActions(5);
```

Get usage information about the bulkhead compartment:

```typescript
import { BulkheadIsolationPolicy } from '@diplomatiq/resily';

// the wrapped method is supposed to return a string
const policy = new BulkheadIsolationPolicy<string>();

// the number of available (free) execution slots in the bulkhead compartment
policy.getAvailableSlotsCount();

// the number of available (free) spaces in the queue
policy.getAvailableQueuedActionsCount();
```

#### NopPolicy

`NopPolicy` does not claim anything. It executes the wrapped method, and returns its result or throws its exceptions, without any intervention.

### Modifying a policy's configuration

All policies' configuration parameters are set via setter methods. This could imply that all policies can be safely reconfigured whenever needed, but providing setter methods instead of constructor parameters is merely because this way the policies are more convenient to use. If you need to reconfigure a policy, you can do that, but not while it is still executing one or more methods: reconfiguring while executing could lead to unexpected side-effects. Therefore, if you tries to reconfigure a policy while executing, a `PolicyModificationNotAllowedException` is thrown.

To safely reconfigure a policy, check whether it is executing or not:

```typescript
const policy = … // any policy

if (!policy.isExecuting()) {
    // you can reconfigure the policy
}
```

## Development

See [CONTRIBUTING.md](https://github.com/Diplomatiq/resily/blob/develop/CONTRIBUTING.md) for details.

---

Copyright (c) 2018 Diplomatiq
