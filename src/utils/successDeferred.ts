export class SuccessDeferred<T> {
    public resolve!: (value?: T | Promise<T>) => void;
    public promise: Promise<T>;

    public constructor() {
        this.promise = new Promise<T>((resolve): void => {
            this.resolve = resolve;
        });
    }
}
