import {timeout} from '@azteam/util';
import scheduleUnique, {_5_MINUTES} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {
    MQ_SYNC_ALL_EPISODE,
    MQ_SYNC_ALL_MOVIE,
    MQ_SYNC_ALL_STAR,
    SCHEDULE_SYNC_ALL_EPISODE,
    SCHEDULE_SYNC_ALL_MOVIE,
    SCHEDULE_SYNC_ALL_STAR,
} from 'src/apps/drama_en/constants/service';

(async () => {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        scheduleUnique.addSchedule(
            SCHEDULE_SYNC_ALL_STAR,
            _5_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_SYNC_ALL_STAR, {}, false);
            },
            sendErrorMessage
        );

        scheduleUnique.addSchedule(
            SCHEDULE_SYNC_ALL_MOVIE,
            _5_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_SYNC_ALL_MOVIE, {}, false);
            },
            sendErrorMessage
        );

        scheduleUnique.addSchedule(
            SCHEDULE_SYNC_ALL_EPISODE,
            _5_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_SYNC_ALL_EPISODE, {}, false);
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('drama-en-schedule-sync', err);
        await timeout(5000);
        process.exit(1);
    }
})();
