import _ from 'lodash';
import multer from 'multer';
import path from 'path';
import moment from 'moment';
import mkdirp from 'mkdirp';
import {sha1} from '@azteam/crypto';
import SharpImage from '@azteam/sharp-image';
import {HTTP_METHOD, limitRequestMiddleware} from '@azteam/express';
import {ErrorException, FILE_EMPTY, FILE_TYPE, SERVER_BUSY} from '@azteam/error';

import {getStorage} from 'src/apps/upload/utils';

const tempsStorage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, process.env.TEMPS_DIR);
    },
    filename(req, file, cb) {
        const now = moment().format('DD-MM-YYYY');
        const dir = `${process.env.TEMPS_DIR}/${now}`;
        mkdirp.sync(dir);
        const name = `${now}/${sha1(file.originalname + Date.now()) + path.extname(file.originalname)}`;
        cb(null, name);
    },
});

const uploadImageMiddleware = multer({
    storage: tempsStorage,
    limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter(req, file, cb) {
        const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (_.includes(allowedMimes, file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ErrorException(FILE_TYPE, {
                    mime: file.mimetype,
                })
            );
        }
    },
});

const uploadVideoMiddleware = multer({
    storage: tempsStorage,
    limits: {
        files: 1,
        fileSize: 25 * 1024 * 1024, // 25MB
    },
    fileFilter(req, file, cb) {
        const allowedMimes = ['video/mp4', 'video/quicktime', 'video/mov'];
        if (_.includes(allowedMimes, file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ErrorException(FILE_TYPE, {
                    mime: file.mimetype,
                })
            );
        }
    },
});

const fileController = {
    uploadSingleImage: {
        path: '/image',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(10),
            uploadImageMiddleware.single('image'),
            async function (req, res) {
                const image = req.file;
                if (_.isEmpty(image)) {
                    return res.error(FILE_EMPTY);
                }

                const storage = await getStorage();
                if (storage) {
                    await SharpImage.getImageInfo(`${process.env.TEMPS_DIR}/${image.filename}`);

                    return res.success({
                        url: `${storage.asset_domain}/temps/${image.filename}`,
                        name: `temps/${image.filename}`,
                        state: req.query.state,
                    });
                }
                return res.error(SERVER_BUSY);
            },
        ],
    },

    uploadSingleVideo: {
        path: '/video',
        type: HTTP_METHOD.POST,
        method: [
            limitRequestMiddleware(5),
            uploadVideoMiddleware.single('video'),
            async function (req, res) {
                const video = req.file;
                if (_.isEmpty(video)) {
                    return res.error(FILE_EMPTY);
                }

                const storage = await getStorage();
                if (storage) {
                    return res.success({
                        url: `${storage.asset_domain}/temps/${video.filename}`,
                        name: `temps/${video.filename}`,
                        state: req.query.state,
                    });
                }
                return res.error(SERVER_BUSY);
            },
        ],
    },
};

export default fileController;
