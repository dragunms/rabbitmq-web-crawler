import {timeout} from '@azteam/util';
import scheduleUnique, {_10_MINUTES, _1_HOUR} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {
    MQ_CRAWL_ALL_STAR_OF_PAGE,
    MQ_CRAWL_LATEST_EPISODE,
    SCHEDULE_CRAWL_LATEST_EPISODE,
    SCHEDULE_CRAWL_LATEST_STAR,
} from 'src/apps/drama_en/constants/service';

(async () => {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        scheduleUnique.addSchedule(
            SCHEDULE_CRAWL_LATEST_STAR,
            _1_HOUR,
            60,
            async function () {
                await messageQueue.send(MQ_CRAWL_ALL_STAR_OF_PAGE, {page: 1}, false);
            },
            sendErrorMessage
        );

        scheduleUnique.addSchedule(
            SCHEDULE_CRAWL_LATEST_EPISODE,
            _10_MINUTES,
            60,
            async function () {
                await messageQueue.send(MQ_CRAWL_LATEST_EPISODE, {}, false);
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('drama-en-schedule-crawler', err);
        await timeout(5000);
        process.exit(1);
    }
})();
