import {timeout} from '@azteam/util';
import scheduleUnique, {_10_MINUTES} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {MQ_CRAWL_ANIME_EN_LATEST_EPISODE, SCHEDULE_CRAWL_ANIME_EN_LATEST_EPISODE} from 'src/apps/anime_en/constants/service';

(async () => {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        scheduleUnique.addSchedule(
            SCHEDULE_CRAWL_ANIME_EN_LATEST_EPISODE,
            _10_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_CRAWL_ANIME_EN_LATEST_EPISODE, {}, false);
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('anime-en-schedule-crawler', err);
        await timeout(5000);
        process.exit(1);
    }
})();
