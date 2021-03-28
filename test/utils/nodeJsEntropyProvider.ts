import { EntropyProvider, UnsignedTypedArray } from '@diplomatiq/crypto-random';
import { randomFill } from 'crypto';

export class NodeJsEntropyProvider implements EntropyProvider {
    public async getRandomValues<T extends UnsignedTypedArray>(array: T): Promise<T> {
        return new Promise<T>((resolve, reject): void => {
            // eslint-disable-next-line promise/prefer-await-to-callbacks
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
