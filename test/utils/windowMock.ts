import { randomFillSync } from 'crypto';

export const windowMock = () => ({
    crypto: {
        getRandomValues: (array: Uint8Array) => randomFillSync(array),
    },
});
