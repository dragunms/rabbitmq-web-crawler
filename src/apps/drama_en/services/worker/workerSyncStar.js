import {timeout} from '@azteam/util';

import {sendDebugMessage, sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {BOOLEAN_STATUS} from 'src/constants/status';
import {MQ_SYNC_ALL_STAR, MQ_SYNC_STAR} from 'src/apps/drama_en/constants/service';

import syncStarRepository from 'src/apps/drama_en/repositories/syncStar/repository';
import starRepository from 'src/apps/drama_en/repositories/star/repository';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_SYNC_ALL_STAR,
            async function () {
                const syncStars = await syncStarRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncStars.map(async (syncStar) => {
                        await messageQueue.send(MQ_SYNC_STAR, {
                            id: syncStar.id,
                        });
                    })
                );

                /* end sync */
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_STAR,
            async function (queueData) {
                const {id} = queueData;

                const syncStar = await syncStarRepository.findOneById(id);

                const data = syncStar.toJSON();
                data.sync_id = data.id;

                let star = await starRepository.findOneBySlug(syncStar.slug);
                if (!star) {
                    star = await starRepository.create(data);
                    await sendDebugMessage(`Create new star ${star.name} - ${process.env.ADMIN_URL}/star/edit/${star.id}`);
                } else if (star.sync_id === syncStar.id) {
                    await starRepository.modify(star, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(`Star is modified, please check it ${star.name} - ${process.env.ADMIN_URL}/star/edit/${star.id}`);
                }

                await syncStarRepository.modify(syncStar, {
                    is_synchronized: BOOLEAN_STATUS.TRUE,
                    forceSynchronized: BOOLEAN_STATUS.TRUE,
                });
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('drama-en-worker-sync-star', err);
        await timeout(5000);
        process.exit(1);
    }
})();
