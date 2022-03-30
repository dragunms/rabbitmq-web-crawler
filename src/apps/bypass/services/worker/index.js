import {timeout} from '@azteam/util';

import {AVAILABLE_STATUS} from 'src/constants/status';
import {MQ_CHECK_COOKIE, MQ_CHECK_PROXY, MQ_COUNT_COOKIE} from 'src/apps/bypass/constants/service';

import {messageQueueProvider, PROVIDER} from 'src/providers';

import {sendDebugMessage, sendErrorMessage} from 'src/modules/message';

import proxyRepository from 'src/apps/bypass/repositories/proxy/repository';
import cookieRepository from 'src/apps/bypass/repositories/cookie/repository';
import {retryWithCookie, getIPByProxy} from 'src/apps/bypass/utils';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        await messageQueue.receiving(
            MQ_CHECK_PROXY,
            async function (queueData) {
                const proxy = await proxyRepository.findOne({
                    _id: queueData.id,
                    status: AVAILABLE_STATUS.AVAILABLE,
                });
                if (proxy) {
                    const ip = await getIPByProxy(proxy);
                    if (ip !== proxy.ip) {
                        await sendDebugMessage(`Warning proxy ${proxy.ip} (result: ${ip})`);
                        await proxyRepository.modify(proxy, {
                            status: AVAILABLE_STATUS.UNAVAILABLE,
                        });
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_CHECK_COOKIE,
            async function (queueData) {
                const cookie = await cookieRepository.findOne({
                    _id: queueData.id,
                    status: AVAILABLE_STATUS.AVAILABLE,
                });
                if (cookie) {
                    const html = await retryWithCookie(`${cookie.protocol}://${cookie.domain}`, cookie);
                    if (!html) {
                        await cookieRepository.modify(cookie, {
                            status: AVAILABLE_STATUS.UNAVAILABLE,
                        });

                        await sendDebugMessage(`Warning: ${cookie.domain} ${cookie.proxy.ip}`);
                    }
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_COUNT_COOKIE,
            async function (queueData) {
                const cookie = await cookieRepository.findOneById(queueData.id);
                if (cookie) {
                    cookie.count += 1;
                    await cookie.save();
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('worker-bypass', err);
        await timeout(5000);
        process.exit(1);
    }
})();
