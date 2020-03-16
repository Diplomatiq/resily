export type BackoffStrategy = (currentRetryCount: number) => number | Promise<number>;
