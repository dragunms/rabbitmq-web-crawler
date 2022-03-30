import {timeout} from '@azteam/util';
import scheduleUnique, {_5_MINUTES} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {
    MQ_SYNC_ANIME_ES_ALL_EPISODE,
    MQ_SYNC_ANIME_ES_ALL_ANIME,
    SCHEDULE_SYNC_ANIME_ES_ALL_EPISODE,
    SCHEDULE_SYNC_ANIME_ES_ALL_ANIME,
} from 'src/apps/anime_es/constants/service';

(async () => {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        scheduleUnique.addSchedule(
            SCHEDULE_SYNC_ANIME_ES_ALL_ANIME,
            _5_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_SYNC_ANIME_ES_ALL_ANIME, {}, false);
            },
            sendErrorMessage
        );

        scheduleUnique.addSchedule(
            SCHEDULE_SYNC_ANIME_ES_ALL_EPISODE,
            _5_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_SYNC_ANIME_ES_ALL_EPISODE, {}, false);
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('anime-es-schedule-sync', err);
        await timeout(5000);
        process.exit(1);
    }
})();
