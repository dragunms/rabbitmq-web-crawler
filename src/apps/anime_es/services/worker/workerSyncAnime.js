import {timeout} from '@azteam/util';

import {sendDebugMessage, sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {BOOLEAN_STATUS} from 'src/constants/status';
import {
    MQ_SYNC_ANIME_ES_ALL_EPISODE,
    MQ_SYNC_ANIME_ES_ALL_ANIME,
    MQ_SYNC_ANIME_ES_EPISODE,
    MQ_SYNC_ANIME_ES_GENRE,
    MQ_SYNC_ANIME_ES_ANIME,
} from 'src/apps/anime_es/constants/service';

import animeRepository from 'src/apps/anime_es/repositories/anime/repository';
import syncAnimeRepository from 'src/apps/anime_es/repositories/syncAnime/repository';
import genreRepository from 'src/apps/anime_es/repositories/genre/repository';
import syncEpisodeRepository from 'src/apps/anime_es/repositories/syncEpisode/repository';
import episodeRepository from 'src/apps/anime_es/repositories/episode/repository';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_SYNC_ANIME_ES_GENRE,
            async function (queueData) {
                if (queueData.name.length) {
                    const genre = await genreRepository.findOneBySlug(queueData.slug);
                    if (!genre) {
                        await genreRepository.create(queueData);
                        await sendDebugMessage(`Create new genre ${genre.name} - ${process.env.ADMIN_URL}/genre/edit/${genre.id}`);
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_ES_ALL_ANIME,
            async function () {
                const syncMovies = await syncAnimeRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncMovies.map(async (syncMovie) => {
                        await messageQueue.send(MQ_SYNC_ANIME_ES_ANIME, {
                            id: syncMovie.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_ES_ANIME,
            async function (queueData) {
                const syncMovie = await syncAnimeRepository.findOneById(queueData.id);

                const data = syncMovie.toJSON();
                data.sync_id = data.id;

                const {genres} = data;

                data.genres = await Promise.all(
                    genres.map(async (genreData) => {
                        return genreRepository.findOneOrCreate({slug: genreData.slug}, genreData);
                    })
                );

                let movie = await animeRepository.findOneBySlug(syncMovie.slug);

                if (!movie) {
                    movie = await animeRepository.create(data);
                    await sendDebugMessage(`Create new movie ${movie.name} - ${process.env.ADMIN_URL}/movie/edit/${movie.id}`);
                } else if (movie.sync_id === syncMovie.id) {
                    await animeRepository.modify(movie, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(`Movie is modified, please check it ${movie.name} - ${process.env.ADMIN_URL}/movie/edit/${movie.id}`);
                }

                await syncAnimeRepository.modify(syncMovie, {
                    is_synchronized: BOOLEAN_STATUS.TRUE,
                    forceSynchronized: BOOLEAN_STATUS.TRUE,
                });
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_ES_ALL_EPISODE,
            async function () {
                const syncEpisodes = await syncEpisodeRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncEpisodes.map(async (syncEpisode) => {
                        await messageQueue.send(MQ_SYNC_ANIME_ES_EPISODE, {
                            id: syncEpisode.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_ES_EPISODE,
            async function (queueData) {
                const syncEpisode = await syncEpisodeRepository.findOneById(queueData.id);

                // remove anime
                const {anime, ...data} = syncEpisode.toJSON();

                data.sync_id = data.id;

                let episode = await episodeRepository.findOneBySlug(syncEpisode.slug);

                if (!episode) {
                    data.anime = await animeRepository.findOneBySlug(anime.slug);

                    if (!data.anime) {
                        throw new Error('Not exists anime');
                    }
                    episode = await episodeRepository.create(data);

                    await sendDebugMessage(
                        `Create new ${episode.anime.name} episode ${episode.episode} - ${process.env.ADMIN_URL}/episode/edit/${episode.id}`
                    );
                } else if (episode.sync_id === syncEpisode.id) {
                    await episodeRepository.modify(episode, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(
                        `Episode is modified, please check it ${episode.anime.name} episode ${episode.episode} - ${process.env.ADMIN_URL}/episode/edit/${episode.id}`
                    );
                }

                await syncEpisodeRepository.modify(syncEpisode, {
                    is_synchronized: BOOLEAN_STATUS.TRUE,
                    forceSynchronized: BOOLEAN_STATUS.TRUE,
                });
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('anime-es-worker-sync-anime', err);
        await timeout(5000);
        process.exit(1);
    }
})();
