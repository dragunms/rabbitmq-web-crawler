import {timeout} from '@azteam/util';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {MQ_CRAWL_ALL_STAR, MQ_CRAWL_ALL_STAR_OF_PAGE, MQ_CRAWL_STAR_BY_SLUG} from 'src/apps/drama_en/constants/service';

import syncStarRepository from 'src/apps/drama_en/repositories/syncStar/repository';

import CrawlerDramanice from './crawler/CrawlerDramanice';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_CRAWL_ALL_STAR,
            async function () {
                const crawler = new CrawlerDramanice();

                const totalPage = await crawler.getTotalPageStar();

                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ALL_STAR_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ALL_STAR_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerDramanice();

                const list = await crawler.getListSlugStarOnPage(queueData.page);

                await Promise.all(
                    list.map(async (starSlug) => {
                        await messageQueue.send(MQ_CRAWL_STAR_BY_SLUG, {
                            starSlug,
                        });
                        return true;
                    })
                );
                await timeout(20000);
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_STAR_BY_SLUG,
            async function (queueData) {
                const {starSlug} = queueData;

                const crawler = new CrawlerDramanice();

                const syncStarData = await crawler.getDataStarBySlug(starSlug);

                const syncStar = await syncStarRepository.findOneBySlug(syncStarData.slug);
                if (syncStar) {
                    await syncStarRepository.modify(syncStar, syncStarData);
                } else {
                    await syncStarRepository.create(syncStarData);
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('drama-en-worker-crawl-star', err);
        await timeout(5000);
        process.exit(1);
    }
})();
