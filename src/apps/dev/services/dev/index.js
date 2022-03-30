import Episode from 'src/apps/drama_en/repositories/episode/model';
import episodeRepository from 'src/apps/drama_en/repositories/episode/repository';

(async function () {
    try {
        const drama = await episodeRepository.findOneBySlug('abcc');
        console.log(drama);
    } catch (e) {
        console.error(e);
    }
})();
