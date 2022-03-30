import {PROVIDER, PROVIDER_TYPE} from 'src/providers';
import {SERVICE} from 'src/constants/service';

export default {
    providers: {
        [PROVIDER_TYPE.REDIS]: {
            name: PROVIDER.REDIS.LOCAL,
            services: [SERVICE.API],
        },
        [PROVIDER_TYPE.RABBIT_MQ]: {
            name: PROVIDER.RABBIT_MQ.SYSTEM,
            services: [SERVICE.API, SERVICE.WORKER],
        },
    },
};
