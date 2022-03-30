import {SERVICE} from 'src/constants/service';

import {PROVIDER, PROVIDER_TYPE} from 'src/providers';

export default {
    providers: {
        [PROVIDER_TYPE.REDIS]: {
            name: PROVIDER.REDIS.LOCAL,
            services: [SERVICE.API, SERVICE.WORKER, SERVICE.SCHEDULE],
        },
        [PROVIDER_TYPE.RABBIT_MQ]: {
            name: PROVIDER.RABBIT_MQ.SYSTEM,
            services: [SERVICE.API, SERVICE.WORKER, SERVICE.SCHEDULE],
        },
    },
};
