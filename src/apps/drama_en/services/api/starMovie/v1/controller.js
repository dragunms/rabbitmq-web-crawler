import {HTTP_METHOD, REQUEST_TYPE, validateMiddleware} from '@azteam/express';

import {rulesSlug} from 'src/constants/validate';

import starMovieRepository from 'src/apps/drama_en/repositories/starMovie/repository';

export default {
    /*
     * Common Role
     */
    movieOnStar: {
        path: '/stars/movie/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const data = await starMovieRepository.find({
                    'star.slug': req.params.slug,
                });
                return res.success(data);
            },
        ],
    },
    starOnMovie: {
        path: '/movies/star/:slug',
        type: HTTP_METHOD.GET,
        method: [
            validateMiddleware(REQUEST_TYPE.PARAMS, rulesSlug),
            async function (req, res) {
                const data = await starMovieRepository.find({
                    'movie.slug': req.params.slug,
                });
                return res.success(data);
            },
        ],
    },

    /*
     *  Admin Role
     */
};
