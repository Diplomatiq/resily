export type OnRetryFn<ResultType> = (
    result: ResultType | undefined,
    error: unknown | undefined,
    currentRetryCount: number,
) => void | Promise<void>;
