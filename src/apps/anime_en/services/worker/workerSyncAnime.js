import {timeout, toSlug} from '@azteam/util';

import {sendDebugMessage, sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {BOOLEAN_STATUS} from 'src/constants/status';
import {
    MQ_SYNC_ANIME_EN_ALL_EPISODE,
    MQ_SYNC_ANIME_EN_ALL_ANIME,
    MQ_SYNC_ANIME_EN_EPISODE,
    MQ_SYNC_ANIME_EN_GENRE,
    MQ_SYNC_ANIME_EN_SUB_CATEGORY,
    MQ_SYNC_ANIME_EN_ANIME,
} from 'src/apps/anime_en/constants/service';

import animeRepository from 'src/apps/anime_en/repositories/anime/repository';
import syncAnimeRepository from 'src/apps/anime_en/repositories/syncAnime/repository';
import genreRepository from 'src/apps/anime_en/repositories/genre/repository';
import subCategoryRepository from 'src/apps/anime_en/repositories/subCategory/repository';
import syncEpisodeRepository from 'src/apps/anime_en/repositories/syncEpisode/repository';
import episodeRepository from 'src/apps/anime_en/repositories/episode/repository';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_SYNC_ANIME_EN_GENRE,
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
            MQ_SYNC_ANIME_EN_SUB_CATEGORY,
            async function (queueData) {
                if (queueData.name.length) {
                    const subCategory = await subCategoryRepository.findOneBySlug(queueData.slug);
                    if (!subCategory) {
                        await subCategoryRepository.create(queueData);
                        await sendDebugMessage(
                            `Create new sub categories ${subCategory.name} - ${process.env.ADMIN_URL}/sub_category/edit/${subCategory.id}`
                        );
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_EN_ALL_ANIME,
            async function () {
                const syncMovies = await syncAnimeRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncMovies.map(async (syncMovie) => {
                        await messageQueue.send(MQ_SYNC_ANIME_EN_ANIME, {
                            id: syncMovie.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_EN_ANIME,
            async function (queueData) {
                const syncAnime = await syncAnimeRepository.findOneById(queueData.id);
                const tempSyncAnimeSlug = toSlug(syncAnime.slug);

                const data = syncAnime.toJSON();

                data.sync_id = data.id;
                // eslint-disable-next-line camelcase
                const {genres, sub_category} = data;

                data.genres = await Promise.all(
                    genres.map(async (genreData) => {
                        // eslint-disable-next-line no-param-reassign
                        const tempGenreSlug = toSlug(genreData.slug);
                        return genreRepository.findOneOrCreate({slug: tempGenreSlug}, {...genreData, slug: tempGenreSlug});
                    })
                );
                const tempSubCategorySlug = toSlug(sub_category.slug);

                data.sub_category = await subCategoryRepository.findOneOrCreate(
                    {slug: tempSubCategorySlug},
                    // eslint-disable-next-line camelcase
                    {...sub_category, slug: tempSubCategorySlug}
                );

                let anime = await animeRepository.findOneBySlug(tempSyncAnimeSlug);

                if (!anime) {
                    anime = await animeRepository.create({...data, slug: tempSyncAnimeSlug});
                    await sendDebugMessage(`Create new movie ${anime.name} - ${process.env.ADMIN_URL}/movie/edit/${anime.id}`);
                } else if (anime.sync_id === syncAnime.id) {
                    await animeRepository.modify(anime, {
                        is_checked: BOOLEAN_STATUS.FALSE,
                    });
                    await sendDebugMessage(`Movie is modified, please check it ${anime.name} - ${process.env.ADMIN_URL}/movie/edit/${anime.id}`);
                }

                await syncAnimeRepository.modify(syncAnime, {
                    is_synchronized: BOOLEAN_STATUS.TRUE,
                    forceSynchronized: BOOLEAN_STATUS.TRUE,
                });
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_EN_ALL_EPISODE,
            async function () {
                const syncEpisodes = await syncEpisodeRepository.find({
                    is_synchronized: BOOLEAN_STATUS.FALSE,
                });

                await Promise.all(
                    syncEpisodes.map(async (syncEpisode) => {
                        await messageQueue.send(MQ_SYNC_ANIME_EN_EPISODE, {
                            id: syncEpisode.id,
                        });
                    })
                );
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SYNC_ANIME_EN_EPISODE,
            async function (queueData) {
                const syncEpisode = await syncEpisodeRepository.findOneById(queueData.id);

                if (syncEpisode) {
                    // remove anime
                    const {anime, slug, ...data} = syncEpisode.toJSON();

                    const tempSyncEpisodeSlug = toSlug(syncEpisode.slug);

                    data.sync_id = data.id;

                    let episode = await episodeRepository.findOneBySlug(tempSyncEpisodeSlug);

                    if (!episode && anime) {
                        const tempAnimeSlug = toSlug(anime.slug);

                        data.anime = await animeRepository.findOneBySlug(tempAnimeSlug);

                        if (!data.anime) {
                            throw new Error('Not exists anime');
                        }

                        episode = await episodeRepository.create({...data, slug: tempSyncEpisodeSlug});

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
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('anime-en-worker-sync-anime', err);
        await timeout(5000);
        process.exit(1);
    }
})();
