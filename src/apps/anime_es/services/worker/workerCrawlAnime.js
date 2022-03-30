import {timeout} from '@azteam/util';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {
    MQ_CRAWL_ANIME_ES_ALL_ANIME,
    MQ_CRAWL_ANIME_ES_EPISODE_BY_SLUG,
    MQ_CRAWL_ANIME_ES_LATEST_EPISODE,
    MQ_CRAWL_ANIME_ES_ANIME_BY_SLUG,
    MQ_CRAWL_ANIME_ES_ALL_ANIME_OF_PAGE,
    MQ_CRAWL_ANIME_ES_POPULAR_ANIME,
    MQ_CRAWL_ANIME_ES_POPULAR_ANIME_OF_PAGE,
} from 'src/apps/anime_es/constants/service';

import syncAnimeRepository from 'src/apps/anime_es/repositories/syncAnime/repository';
import episodeRepository from 'src/apps/anime_es/repositories/episode/repository';
import syncEpisodeRepository from 'src/apps/anime_es/repositories/syncEpisode/repository';

import CrawlerAnimeflv from './crawler/crawlerAnimeflv';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_ALL_ANIME,
            async function () {
                const crawler = new CrawlerAnimeflv();
                const totalPage = await crawler.getTotalPageAnime();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_ES_ALL_ANIME_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_ALL_ANIME_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerAnimeflv();

                const list = await crawler.getListSlugAnimeOnPage(queueData.page);

                await Promise.all(
                    list.map(async (slug) => {
                        await messageQueue.send(MQ_CRAWL_ANIME_ES_ANIME_BY_SLUG, {
                            animeSlug: slug,
                        });
                        return true;
                    })
                );
                await timeout(20000);
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_ANIME_BY_SLUG,
            async function (queueData) {
                await timeout(5000);
                const {animeSlug} = queueData;
                const crawler = new CrawlerAnimeflv();

                if (animeSlug) {
                    const syncAnimeData = await crawler.getDataAnimeBySlug(animeSlug);
                    if (syncAnimeData) {
                        const syncAnime = await syncAnimeRepository.findOneBySlug(syncAnimeData.slug);
                        if (syncAnime) {
                            await syncAnimeRepository.modify(syncAnime, syncAnimeData);
                        } else {
                            await syncAnimeRepository.create(syncAnimeData);
                        }
                        /* crawl episode */
                        await Promise.all(
                            syncAnimeData.episodes.map(async (syncEpisodeData) => {
                                const syncEpisode = await syncEpisodeRepository.findOneBySlug(syncEpisodeData.slug);
                                if (!syncEpisode) {
                                    await messageQueue.send(MQ_CRAWL_ANIME_ES_EPISODE_BY_SLUG, {
                                        movieSlug: syncAnimeData.slug,
                                        episodeSlug: syncEpisodeData.slug,
                                    });
                                }
                                return true;
                            })
                        );
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_LATEST_EPISODE,
            async function () {
                const crawler = new CrawlerAnimeflv();
                const recentRelease = await crawler.getRecentRelease();

                recentRelease.map(async (data) => {
                    const episode = await episodeRepository.findOneBySlug(data.episodeSlug);
                    if (!episode) {
                        await messageQueue.send(MQ_CRAWL_ANIME_ES_EPISODE_BY_SLUG, {
                            episodeSlug: data.episodeSlug,
                        });
                    }
                    return true;
                });
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_EPISODE_BY_SLUG,
            async function (queueData) {
                await timeout(5000);

                const {movieSlug, episodeSlug} = queueData;

                const syncMovie = await syncAnimeRepository.findOneBySlug(movieSlug);
                if (syncMovie) {
                    const crawler = new CrawlerAnimeflv();
                    const syncEpisodeData = await crawler.getDataEpisodeBySlug(episodeSlug);

                    syncEpisodeData.anime = syncMovie;
                    const syncEpisode = await syncEpisodeRepository.findOneBySlug(episodeSlug);
                    if (syncEpisode) {
                        await syncEpisodeRepository.modify(syncEpisode, syncEpisodeData);
                    } else {
                        await syncEpisodeRepository.create(syncEpisodeData);
                    }
                } else {
                    await messageQueue.send(MQ_CRAWL_ANIME_ES_EPISODE_BY_SLUG, {
                        movieSlug,
                        episodeSlug,
                    });
                    await messageQueue.send(MQ_CRAWL_ANIME_ES_ANIME_BY_SLUG, {
                        animeSlug: movieSlug,
                    });
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_POPULAR_ANIME,
            async function () {
                const crawler = new CrawlerAnimeflv();
                const totalPage = await crawler.getTotalPagePopularAnime();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_ES_POPULAR_ANIME_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_ES_POPULAR_ANIME_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerAnimeflv();

                const list = await crawler.getPopularAnimeOnPage(queueData.page);

                await Promise.all(
                    list.map(async (animeSlug) => {
                        await messageQueue.send(MQ_CRAWL_ANIME_ES_ANIME_BY_SLUG, {
                            animeSlug,
                        });
                        return true;
                    })
                );
                await timeout(20000);
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('anime-es-worker-crawl-anime', err);
        await timeout(5000);
        process.exit(1);
    }
})();
