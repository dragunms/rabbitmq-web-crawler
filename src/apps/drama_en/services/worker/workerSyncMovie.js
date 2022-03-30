import {timeout} from '@azteam/util';

import {sendDebugMessage, sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {BOOLEAN_STATUS} from 'src/constants/status';
import {
    MQ_SYNC_ALL_EPISODE,
    MQ_SYNC_ALL_MOVIE,
    MQ_SYNC_COUNTRY,
    MQ_SYNC_EPISODE,
    MQ_SYNC_GENRE,
    MQ_SYNC_MOVIE,
    MQ_SYNC_STAR_MOVIE,
} from 'src/apps/drama_en/constants/service';
import movieRepository from 'src/apps/drama_en/repositories/movie/repository';
import syncMovieRepository from 'src/apps/drama_en/repositories/syncMovie/repository';
import countryRepository from 'src/apps/drama_en/repositories/country/repository';
import genreRepository from 'src/apps/drama_en/repositories/genre/repository';
import starMovieRepository from 'src/apps/drama_en/repositories/starMovie/repository';
import syncEpisodeRepository from 'src/apps/drama_en/repositories/syncEpisode/repository';
import episodeRepository from 'src/apps/drama_en/repositories/episode/repository';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_SYNC_GENRE,
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
            MQ_SYNC_COUNTRY,
            async function (queueData) {
                if (queueData.name.length) {
                    const country = await countryRepository.findOneBySlug(queueData.slug);
                    if (!country) {
                        await countryRepository.create(queueData);
                        await sendDebugMessage(`Create new country ${country.name} - ${process.env.ADMIN_URL}/country/edit/${country.id}`);
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_STAR_MOVIE,
            async function (queueData) {
                const {movie, star} = queueData;
                const starMovie = await starMovieRepository.findOne({
                    'movie.slug': movie.slug,
                    'star.slug': star.slug,
                });

                if (!starMovie) {
                    await starMovieRepository.create({
                        movie,
                        star,
                    });
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ALL_MOVIE,
            async function () {
                const syncMovies = await syncMovieRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncMovies.map(async (syncMovie) => {
                        await messageQueue.send(MQ_SYNC_MOVIE, {
                            id: syncMovie.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_MOVIE,
            async function (queueData) {
                const syncMovie = await syncMovieRepository.findOneById(queueData.id);

                const data = syncMovie.toJSON();
                data.sync_id = data.id;

                const {country, genres} = data;

                data.country = await countryRepository.findOneOrCreate(
                    {
                        slug: country.slug,
                    },
                    country
                );

                data.genres = await Promise.all(
                    genres.map(async (genreData) => {
                        return genreRepository.findOneOrCreate({slug: genreData.slug}, genreData);
                    })
                );

                let movie = await movieRepository.findOneBySlug(syncMovie.slug);

                if (!movie) {
                    movie = await movieRepository.create(data);
                    await sendDebugMessage(`Create new movie ${movie.name} - ${process.env.ADMIN_URL}/movie/edit/${movie.id}`);
                } else if (movie.sync_id === syncMovie.id) {
                    await movieRepository.modify(movie, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(`Movie is modified, please check it ${movie.name} - ${process.env.ADMIN_URL}/movie/edit/${movie.id}`);
                }

                await syncMovieRepository.modify(syncMovie, {
                    is_synchronized: BOOLEAN_STATUS.TRUE,
                    forceSynchronized: BOOLEAN_STATUS.TRUE,
                });
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ALL_EPISODE,
            async function () {
                const syncEpisodes = await syncEpisodeRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncEpisodes.map(async (syncEpisode) => {
                        await messageQueue.send(MQ_SYNC_EPISODE, {
                            id: syncEpisode.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_EPISODE,
            async function (queueData) {
                const syncEpisode = await syncEpisodeRepository.findOneById(queueData.id);

                // remove movie
                const {movie, ...data} = syncEpisode.toJSON();
                data.sync_id = data.id;

                let episode = await episodeRepository.findOneBySlug(syncEpisode.slug);

                if (!episode) {
                    data.movie = await movieRepository.findOneBySlug(movie.slug);

                    if (!data.movie) {
                        throw new Error('Not exists movie');
                    }
                    episode = await episodeRepository.create(data);

                    await sendDebugMessage(
                        `Create new ${episode.movie.name} episode ${episode.episode} - ${process.env.ADMIN_URL}/episode/edit/${episode.id}`
                    );
                } else if (episode.sync_id === syncEpisode.id) {
                    await episodeRepository.modify(episode, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(
                        `Episode is modified, please check it ${episode.movie.name} episode ${episode.episode} - ${process.env.ADMIN_URL}/episode/edit/${episode.id}`
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
        await sendErrorMessage('drama-en-worker-sync-movie', err);
        await timeout(5000);
        process.exit(1);
    }
})();
