import {timeout} from '@azteam/util';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {MQ_CRAWL_ALL_MOVIE, MQ_CRAWL_EPISODE_BY_SLUG, MQ_CRAWL_LATEST_EPISODE, MQ_CRAWL_MOVIE_BY_SLUG} from 'src/apps/drama_en/constants/service';

import syncMovieRepository from 'src/apps/drama_en/repositories/syncMovie/repository';
import episodeRepository from 'src/apps/drama_en/repositories/episode/repository';
import syncEpisodeRepository from 'src/apps/drama_en/repositories/syncEpisode/repository';

import CrawlerDramanice from './crawler/CrawlerDramanice';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_CRAWL_ALL_MOVIE,
            async function () {
                const crawler = new CrawlerDramanice();
                const movies = await crawler.getAllMovie();
                await Promise.all(
                    movies.map(async (movieSlug) => {
                        await messageQueue.send(MQ_CRAWL_MOVIE_BY_SLUG, {
                            movieSlug,
                        });
                        return true;
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_MOVIE_BY_SLUG,
            async function (queueData) {
                await timeout(5000);

                const {movieSlug} = queueData;

                const crawler = new CrawlerDramanice();
                const syncMovieData = await crawler.getDataMovieBySlug(movieSlug);

                const syncMovie = await syncMovieRepository.findOneBySlug(syncMovieData.slug);
                if (syncMovie) {
                    await syncMovieRepository.modify(syncMovie, syncMovieData);
                } else {
                    await syncMovieRepository.create(syncMovieData);
                }

                /* crawl episode */
                await Promise.all(
                    syncMovieData.episodes.map(async (syncEpisodeData) => {
                        const syncEpisode = await syncEpisodeRepository.findOneBySlug(syncEpisodeData.slug);
                        if (!syncEpisode) {
                            await messageQueue.send(MQ_CRAWL_EPISODE_BY_SLUG, {
                                movieSlug: syncMovieData.slug,
                                episodeSlug: syncEpisodeData.slug,
                            });
                        }
                        return true;
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_LATEST_EPISODE,
            async function () {
                const crawler = new CrawlerDramanice();
                const episodes = await crawler.getLatestEpisodes();

                episodes.map(async (data) => {
                    const episode = await episodeRepository.findOneBySlug(data.episodeSlug);
                    if (!episode) {
                        await messageQueue.send(MQ_CRAWL_EPISODE_BY_SLUG, {
                            movieSlug: data.movieSlug,
                            episodeSlug: data.episodeSlug,
                        });
                    }
                    return true;
                });
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CRAWL_EPISODE_BY_SLUG,
            async function (queueData) {
                await timeout(5000);

                const {movieSlug, episodeSlug} = queueData;

                const syncMovie = await syncMovieRepository.findOneBySlug(movieSlug);
                if (syncMovie) {
                    const crawler = new CrawlerDramanice();

                    const syncEpisodeData = await crawler.getDataEpisodeBySlug(movieSlug, episodeSlug);
                    syncEpisodeData.movie = syncMovie;

                    const syncEpisode = await syncEpisodeRepository.findOneBySlug(episodeSlug);

                    if (syncEpisode) {
                        await syncEpisodeRepository.modify(syncEpisode, syncEpisodeData);
                    } else {
                        await syncEpisodeRepository.create(syncEpisodeData);
                    }
                } else {
                    await messageQueue.send(MQ_CRAWL_EPISODE_BY_SLUG, {
                        movieSlug,
                        episodeSlug,
                    });
                    await messageQueue.send(MQ_CRAWL_MOVIE_BY_SLUG, {
                        movieSlug,
                    });
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('drama-en-worker-crawl-movie', err);
        await timeout(5000);
        process.exit(1);
    }
})();
