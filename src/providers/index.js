import _ from 'lodash';

import messageQueueProvider from 'src/providers/messageQueue.provider';
import redisProvider from 'src/providers/redis.provider';
import mongoProvider from 'src/providers/mongo.provider';

export const PROVIDER_TYPE = {
    REDIS: 'REDIS',
    RABBIT_MQ: 'RABBIT_MQ',
};

export const PROVIDER = {
    REDIS: {
        LOCAL: 'local',
    },
    RABBIT_MQ: {
        SYSTEM: 'system',
    },
};

export async function waitRegisterProvider(configs, service) {
    await Promise.all(
        _.map(configs, async function (providerInfo, provider) {
            if (providerInfo.services.includes(service)) {
                switch (provider) {
                    case PROVIDER_TYPE.REDIS: {
                        const redis = redisProvider.getConnection(providerInfo.name);
                        await redis.waitConnection();
                        break;
                    }
                    case PROVIDER_TYPE.RABBIT_MQ: {
                        const mq = messageQueueProvider.getConnection(providerInfo.name);
                        await mq.waitConnection();
                        break;
                    }
                    default:
                        break;
                }
            }
        })
    );
}

export async function closeAllProvider() {
    await mongoProvider.closeAll();
}

export {redisProvider, mongoProvider, messageQueueProvider};
