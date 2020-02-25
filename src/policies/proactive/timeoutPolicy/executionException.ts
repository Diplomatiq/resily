export class ExecutionException extends Error {
    public constructor(public innerException: unknown) {
        super();
    }
}
