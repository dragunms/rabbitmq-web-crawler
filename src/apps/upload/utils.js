import Monitor from '@azteam/monitor';
import HttpREST from 'src/modules/httpREST';

import {PROVIDER, redisProvider} from 'src/providers';

import {USER_LEVEL} from 'src/constants/system';

const redis = redisProvider.getConnection(PROVIDER.REDIS.LOCAL);

export async function getStorage() {
    const ip = await Monitor.getExternalIP();

    const cacheKey = `storage_${ip}`;
    let storage = await redis.get(cacheKey);
    if (!storage) {
        const client = new HttpREST({
            level: USER_LEVEL.SYSTEM,
        });

        storage = await client.getStorage(ip);
        if (storage) {
            redis.set(cacheKey, storage);
        }
    }

    return storage;
}
