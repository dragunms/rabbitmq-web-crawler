import {HTTP_METHOD} from '@azteam/express';

import {bypassCloudflare} from 'src/apps/bypass/utils';

export default {
    /*
     *  Common Role
     */

    post: {
        path: '/cloudflare/:url',
        type: HTTP_METHOD.POST,
        method: [
            async function (req, res) {
                const {url} = req.params;
                const {method, body, headers} = req.body;

                const html = await bypassCloudflare(url, {
                    method: method || 'GET',
                    body: body ? JSON.parse(body) : {},
                    headers: headers ? JSON.parse(headers) : {},
                });
                const matches = url.match(/\.(jpg|png|gif|jpeg)/);
                if (matches) {
                    return res.set({'Content-Type': `image/${matches[1]}`}).send(html);
                }
                return res.send(html);
            },
        ],
    },
};
