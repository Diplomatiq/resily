# resily

Resily is a TypeScript resilience and transient-fault-handling library that allows developers to express policies such as Retry, Circuit Breaker, Timeout, Bulkhead Isolation, and Fallback. Inspired by [App-vNext/Polly](https://github.com/App-vNext/Polly).

<p>
<a href="https://travis-ci.org/Diplomatiq/resily" target="_blank" style="text-decoration: none;">
  <img src="https://img.shields.io/travis/Diplomatiq/resily.svg" alt="build status">
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

Every policy extends the abstract `Policy` class, which has an `execute` method. Your code wrapped into the policy gets executed when you invoke `execute`. The `execute` method is asynchronous, so it returns a `Promise` resolving with the return value of the executed method.

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

| Policy                                | What does it claim?                                               | How does it work?                                                   |
| ------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| [**RetryPolicy**](#retrypolicy)       | Many faults are transient and will not occur again after a delay. | Allows configuring automatic retries on specified conditions.       |
| [**FallbackPolicy**](#fallbackpolicy) | Failures happen, and we can prepare for them.                     | Allows configuring substitute values or automated fallback actions. |

#### Proactive policies summary

| Policy                              | What does it claim?                                               | How does it work?                                                         |
| ----------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [**TimeoutPolicy**](#timeoutpolicy) | After some time, it is unlikely that the call will be successful. | Ensures the caller does not have to wait more than the specified timeout. |

### Reactive policies

Every reactive policy extends the `ReactivePolicy` class, which means they can be configured with predicates to react on specific results and/or exceptions:

```typescript
const policy = … // any reactive policy

// if the executed code returns 5, the policy will react
policy.handleResult(r => r === 5);

// will be handled
await policy.execute(() => 5);

// will be handled
await policy.execute(async () => 5);

// will not be handled
await policy.execute(() => 2);

// will not be handled
await policy.execute(async () => 2);
```

```typescript
const policy = … // any reactive policy

// if the executed code throws a ConcurrentAccessException, the policy will react
policy.handleException(e => e instanceof ConcurrentAccessException);

// will be handled
await policy.execute(() => {
    throw new ConcurrentAccessException();
});

// will be handled
await policy.execute(async () => {
    throw new ConcurrentAccessException();
});

// will not be handled
await policy.execute(() => {
    throw new OutOfRangeException();
});

// will not be handled
await policy.execute(async () => {
    throw new OutOfRangeException();
});
```

If the policy is configured to handle multiple kinds of results or exceptions, it will react if any of them occurs:

```typescript
const policy = … // any reactive policy

policy.handleResult(r => r === 5);
policy.handleResult(r => r === 7);
policy.handleException(e => e instanceof ConcurrentAccessException);
policy.handleException(e => e instanceof InvalidArgumentException);

// will be handled
await policy.execute(() => 5);

// will be handled
await policy.execute(async () => 5);

// will be handled
await policy.execute(() => 7);

// will be handled
await policy.execute(async () => 7);

// will be handled
await policy.execute(() => {
    throw new ConcurrentAccessException();
});

// will be handled
await policy.execute(async () => {
    throw new ConcurrentAccessException();
});

// will be handled
await policy.execute(() => {
    throw new InvalidArgumentException();
});

// will be handled
await policy.execute(async () => {
    throw new InvalidArgumentException();
});

// will not be handled
await policy.execute(() => 2);

// will not be handled
await policy.execute(async () => 2);

// will not be handled
await policy.execute(() => {
    throw new OutOfRangeException();
});

// will not be handled
await policy.execute(async () => {
    throw new OutOfRangeException();
});
```

You can configure the policy to react on any result and/or to any exception:

```typescript
const policy = … // any reactive policy

// react on any result
policy.handleResult(() => true);

// react on any exception
policy.handleException(() => true);
```

#### RetryPolicy

`RetryPolicy` claims that many faults are transient and will not occur again after a delay. It allows configuring automatic retries on specified conditions.

Since `RetryPolicy` is a reactive policy, you can configure the policy to retry the execution on specific results or exceptions with `handleResult` and `handleException`. See the [Reactive policies](#reactive-policies) section for details.

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

Since `FallbackPolicy` is a reactive policy, you can configure the policy to fallback along its fallback chain on specific results or exceptions with `handleResult` and `handleException`. See the [Reactive policies](#reactive-policies) section for details.

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

### Proactive policies

Every proactive policy extends the `ProactivePolicy` class.

#### TimeoutPolicy

`TimeoutPolicy` claims that after some time, it is unlikely the call will be successful. It ensures the caller does not have to wait more than the specified timeout.

Only asynchronous methods can be executed within a `TimeoutPolicy`, or else no timeout happens. `TimeoutPolicy` is implemented with `Promise.race()`, racing the promise returned by the executed method (`executionPromise`) with a promise that is rejected after the specified time elapses (`timeoutPromise`). If the executed method is not asynchronous (i.e. it does not have at least one point to pause its execution at), no timeout will happen even if the execution takes longer than the specified timeout duration, since there is no point in time for taking the control out from the executed method's hands to reject the `timeoutPromise`.

The executed method is fully executed to its end (unless it throws an exception), regardless of whether a timeout has occured or not. `TimeoutPolicy` ensures that the caller does not have to wait more than the specified timeout, but it does neither cancel nor abort\* the execution of the method. This means that if the executed method has side effects, these side effects can occur even after the timeout happened.

\*TypeScript/JavaScript has no _generic_ way of canceling or aborting an executing method, either synchronous or asynchronous. `TimeoutPolicy` runs arbitrary user-provided code: it cannot be assumed the code is prepared in any way (e.g. it has cancel points). The provided code _could_ be executed in a separate worker thread so it can be aborted instantaneously by terminating the worker, but run-time compiling a worker from user-provided code is ugly and error-prone.

On timeout, the Promise returned by the policy's `execute` method is rejected with a `TimeoutException`:

```typescript
import { TimeoutException, TimeoutPolicy } from '@diplomatiq/resily';

const policy = new TimeoutPolicy();

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

const policy = new TimeoutPolicy();
policy.timeoutAfter(1000); // timeout after 1000 ms
```

Perform certain actions on timeout:

```typescript
import { TimeoutPolicy } from '@diplomatiq/resily';

const policy = new TimeoutPolicy();
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

const policy = new TimeoutPolicy();

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

## Development

See [CONTRIBUTING.md](https://github.com/Diplomatiq/resily/blob/develop/CONTRIBUTING.md) for details.

---

Copyright (c) 2018 Diplomatiq
