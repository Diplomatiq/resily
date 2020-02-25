export class TimeoutException extends Error {
    public constructor(public readonly timedOutAfterMs: number) {
        super();
    }
}
