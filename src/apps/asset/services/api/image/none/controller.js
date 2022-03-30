import fs from 'fs';
import moment from 'moment';
import etag from 'etag';
import 'moment-round';
import bwipjs from 'bwip-js';
import SharpImage from '@azteam/sharp-image';
import {HTTP_METHOD} from '@azteam/express';

import {sendErrorMessage} from 'src/modules/message';

const IMG_DIR = `${process.env.STORAGE_DIR}/images`;

export default {
    default: {
        path: '/default.jpg',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                res.type('image/png');
                return res.sendFile(`${IMG_DIR}/default.png`);
            },
        ],
    },

    barcode: {
        path: '/barcode/*.jpg',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                // eslint-disable-next-line new-cap
                const etagHash = etag(req.url + new moment().floor(15, 'minutes').unix());
                if (req.headers['if-none-match'] === etagHash) {
                    return res.status(304).send();
                }
                try {
                    const image = await bwipjs.toBuffer({
                        bcid: 'code128',
                        text: req.params[0],
                        scale: 7,
                        padding: 2,
                        height: 10,
                        includetext: true,
                        textxalign: 'center',
                    });

                    res.set({
                        'Content-Type': 'image/jpg',
                        ETag: etagHash,
                    });
                    return res.status(200).send(image);
                } catch (err) {
                    await sendErrorMessage('barcode', err);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },

    qrcode: {
        path: '/qrcode/*.jpg',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                // eslint-disable-next-line new-cap
                const etagHash = etag(req.url + new moment().floor(15, 'minutes').unix());
                if (req.headers['if-none-match'] === etagHash) {
                    return res.status(304).send();
                }
                try {
                    const image = await bwipjs.toBuffer({
                        padding: 2,
                        bcid: 'qrcode',
                        text: `${req.params[0]}`,
                        scale: 15,
                        backgroundcolor: 'FFFFFF',
                    });

                    res.set({
                        'Content-Type': 'image/jpg',
                        ETag: etagHash,
                    });
                    return res.status(200).send(image);
                } catch (err) {
                    await sendErrorMessage('qrcode', err);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },

    resize: {
        path: '/*.(png|jpg|jpeg)',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const imgPath = `${IMG_DIR}/${req.params[0]}.${req.params[1]}`;

                if (fs.existsSync(imgPath)) {
                    // eslint-disable-next-line new-cap
                    const etagHash = etag(req.url + new moment().floor(15, 'minutes').unix());
                    if (req.headers['if-none-match'] === etagHash) {
                        return res.status(304).send();
                    }

                    const width = req.query.w ? parseInt(req.query.w, 10) : null;
                    const height = req.query.h ? parseInt(req.query.h, 10) : null;
                    let format = null;
                    if (['png', 'jpg', 'webp'].includes(req.query.t)) {
                        format = req.query.t;
                    }
                    res.setHeader('ETag', etagHash);
                    const request = await SharpImage.resize(imgPath, format, width, height);

                    res.type(`image/${format || 'jpg'}`);
                    return request.pipe(res);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },

    gif: {
        path: '/*.gif',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const imgPath = `${IMG_DIR}/${req.params[0]}.gif`;

                if (fs.existsSync(imgPath)) {
                    // eslint-disable-next-line new-cap
                    const etagHash = etag(req.url + new moment().floor(15, 'minutes').unix());
                    if (req.headers['if-none-match'] === etagHash) {
                        return res.status(304).send();
                    }

                    return res.sendFile(imgPath);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },
};
