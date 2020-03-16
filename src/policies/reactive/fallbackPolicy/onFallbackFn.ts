export type OnFallbackFn<ResultType> = (
    result: ResultType | undefined,
    error: unknown | undefined,
) => void | Promise<void>;
