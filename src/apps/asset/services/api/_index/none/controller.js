import fs from 'fs';
import {HTTP_METHOD} from '@azteam/express';

const VIDEO_DIR = `${process.env.STORAGE_DIR}/videos`;

export default {
    temps: {
        path: '/temps/*',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const filePath = `${process.env.TEMPS_DIR}/${req.params[0]}`;
                if (fs.existsSync(filePath)) {
                    return res.sendFile(filePath);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },

    video: {
        path: '/*.(mp4|mov)',
        type: HTTP_METHOD.GET,
        method: [
            async function (req, res) {
                const videoPath = `${VIDEO_DIR}/${req.params[0]}.${req.params[1]}`;
                if (fs.existsSync(videoPath)) {
                    return res.sendFile(videoPath);
                }
                return res.redirect(301, '/default.jpg');
            },
        ],
    },
};
