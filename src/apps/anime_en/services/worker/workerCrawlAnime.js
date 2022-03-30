import {timeout} from '@azteam/util';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {
    MQ_CRAWL_ANIME_EN_ALL_ANIME,
    MQ_CRAWL_ANIME_EN_EPISODE_BY_SLUG,
    MQ_CRAWL_ANIME_EN_LATEST_EPISODE,
    MQ_CRAWL_ANIME_EN_ANIME_BY_SLUG,
    MQ_CRAWL_ANIME_EN_ALL_ANIME_OF_PAGE,
    MQ_CRAWL_ANIME_EN_POPULAR_ANIME,
    MQ_CRAWL_ANIME_EN_POPULAR_ANIME_OF_PAGE,
    MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE,
    MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE_OF_PAGE,
    MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE,
    MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE_OF_PAGE,
} from 'src/apps/anime_en/constants/service';

import syncAnimeRepository from 'src/apps/anime_en/repositories/syncAnime/repository';
import syncEpisodeRepository from 'src/apps/anime_en/repositories/syncEpisode/repository';

import CrawlerGogoanime from './crawler/crawlerGogoanime';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_ALL_ANIME,
            async function () {
                const crawler = new CrawlerGogoanime();
                const totalPage = await crawler.getTotalPageAnime();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_ALL_ANIME_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_ALL_ANIME_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerGogoanime();

                const list = await crawler.getListSlugAnimeOnPage(queueData.page);
                await Promise.all(
                    list.map(async (slug) => {
                        await messageQueue.send(MQ_CRAWL_ANIME_EN_ANIME_BY_SLUG, {
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
            MQ_CRAWL_ANIME_EN_ANIME_BY_SLUG,
            async function (queueData) {
                await timeout(7000);
                const {animeSlug} = queueData;
                const crawler = new CrawlerGogoanime();
                if (animeSlug) {
                    const syncAnimeData = await crawler.getDataAnimeBySlug(animeSlug);
                    if (syncAnimeData) {
                        const syncAnime = await syncAnimeRepository.findOneBySlug(syncAnimeData.slug);
                        if (syncAnime) {
                            await syncAnimeRepository.modify(syncAnime, syncAnimeData);
                        } else {
                            await syncAnimeRepository.create(syncAnimeData);
                        }

                        await timeout(10000);

                        const syncMovie = await syncAnimeRepository.findOneBySlug(syncAnimeData.slug);

                        /* crawl episode */
                        await Promise.all(
                            syncAnimeData.episodes.map(async (syncEpisodeData) => {
                                const syncEpisode = await syncEpisodeRepository.findOneBySlug(syncEpisodeData.slug);
                                if (!syncEpisode && syncMovie.slug) {
                                    await messageQueue.send(MQ_CRAWL_ANIME_EN_EPISODE_BY_SLUG, {
                                        movieSlug: syncMovie.slug,
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
            MQ_CRAWL_ANIME_EN_LATEST_EPISODE,
            async function () {
                const crawler = new CrawlerGogoanime();
                const totalPage = await crawler.getTotalPageRecentAnimeEpisode();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_EPISODE_BY_SLUG,
            async function (queueData) {
                await timeout(8000);

                const {movieSlug, episodeSlug} = queueData;

                const syncMovie = await syncAnimeRepository.findOneBySlug(movieSlug);
                if (syncMovie) {
                    const crawler = new CrawlerGogoanime();
                    const syncEpisodeData = await crawler.getDataEpisodeBySlug(episodeSlug);
                    if (syncEpisodeData) {
                        syncEpisodeData.anime = syncMovie;
                        const syncEpisode = await syncEpisodeRepository.findOneBySlug(episodeSlug);
                        if (syncEpisode) {
                            console.log('MODIFY EPISODE: ', syncEpisodeData.slug);

                            await syncEpisodeRepository.modify(syncEpisode, syncEpisodeData);
                        } else {
                            console.log('CREATE EPISODE:', syncEpisodeData.slug);
                            await syncEpisodeRepository.create(syncEpisodeData);
                        }
                    }
                } else {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_EPISODE_BY_SLUG, {
                        movieSlug,
                        episodeSlug,
                    });
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_ANIME_BY_SLUG, {
                        animeSlug: movieSlug,
                    });
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_POPULAR_ANIME,
            async function () {
                const crawler = new CrawlerGogoanime();
                const totalPage = await crawler.getTotalPagePopularAnime();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_POPULAR_ANIME_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_POPULAR_ANIME_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerGogoanime();

                const list = await crawler.getPopularAnimeOnPage(queueData.page);
                await Promise.all(
                    list.map(async (anime) => {
                        if (anime.slug) {
                            const syncAnimeData = await crawler.getDataAnimeBySlug(anime.slug);
                            syncAnimeData.view = anime.view;
                            const syncAnime = await syncAnimeRepository.findOneBySlug(anime.slug);
                            if (syncAnime) {
                                await syncAnimeRepository.modify(syncAnime, syncAnimeData);
                            } else {
                                await syncAnimeRepository.create(syncAnimeData);
                            }
                        }
                        return true;
                    })
                );
                await timeout(20000);
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE,
            async function () {
                const crawler = new CrawlerGogoanime();
                const totalPage = await crawler.getTotalPageChineseAnimeEpisode();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_CHINESE_ANIME_EPISODE_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerGogoanime();

                const list = await crawler.getChineseAnimeEpisodeOnPage(queueData.page);

                await Promise.all(
                    list.map(async (episode) => {
                        if (episode.slug) {
                            const syncEpisode = await syncEpisodeRepository.findOneBySlug(episode.slug);
                            if (syncEpisode) {
                                const syncAnime = await syncAnimeRepository.findOneBySlug(syncEpisode.anime.slug);
                                const syncAnimeData = syncAnime;
                                syncAnimeData.country = 'China';
                                if (syncAnime) {
                                    await syncAnimeRepository.modify(syncAnime, syncAnimeData);
                                } else {
                                    await syncAnimeRepository.create(syncAnimeData);
                                }
                            }
                        }
                        return true;
                    })
                );
                await timeout(20000);
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE,
            async function () {
                const crawler = new CrawlerGogoanime();
                const totalPage = await crawler.getTotalPageRecentAnimeEpisode();
                for (let page = totalPage; page >= 1; page -= 1) {
                    await messageQueue.send(MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE_OF_PAGE, {page});
                    await timeout(5000);
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_ANIME_EN_RECENT_ANIME_EPISODE_OF_PAGE,
            async function (queueData) {
                const crawler = new CrawlerGogoanime();

                const list = await crawler.getRecentAnimeEpisodeOnPage(queueData.page);
                await Promise.all(
                    list.map(async (animeSlug) => {
                        await messageQueue.send(MQ_CRAWL_ANIME_EN_ANIME_BY_SLUG, {
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
        await sendErrorMessage('anime-en-worker-crawl-anime', err);
        await timeout(5000);
        process.exit(1);
    }
})();
