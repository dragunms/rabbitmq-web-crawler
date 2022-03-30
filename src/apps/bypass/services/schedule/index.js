import {timeout} from '@azteam/util';
import scheduleUnique, {_30_MINUTES, _5_MINUTES} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';
import {messageQueueProvider, PROVIDER} from 'src/providers';

import {AVAILABLE_STATUS} from 'src/constants/status';
import {MQ_CHECK_COOKIE, MQ_CHECK_PROXY, SCHEDULE_CHECK_COOKIES, SCHEDULE_CHECK_PROXIES} from 'src/apps/bypass/constants/service';

import proxyRepository from 'src/apps/bypass/repositories/proxy/repository';
import cookieRepository from 'src/apps/bypass/repositories/cookie/repository';

(async () => {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);

        scheduleUnique.addSchedule(
            SCHEDULE_CHECK_PROXIES,
            _30_MINUTES,
            300,
            async function () {
                let isNext = true;
                for (let page = 1; isNext; page += 1) {
                    // eslint-disable-next-line no-await-in-loop
                    const proxies = await proxyRepository.find({status: AVAILABLE_STATUS.AVAILABLE}, {page});
                    if (!proxies.docs.length) {
                        isNext = false;
                    } else {
                        // eslint-disable-next-line no-await-in-loop
                        await Promise.all(
                            proxies.docs.map((proxy) => {
                                return messageQueue.send(MQ_CHECK_PROXY, {
                                    id: proxy.id,
                                });
                            })
                        );
                    }
                }
            },
            sendErrorMessage
        );

        scheduleUnique.addSchedule(
            SCHEDULE_CHECK_COOKIES,
            _5_MINUTES,
            300,
            async function () {
                let isNext = true;
                for (let page = 1; isNext; page += 1) {
                    // eslint-disable-next-line no-await-in-loop
                    const cookies = await cookieRepository.find({status: AVAILABLE_STATUS.AVAILABLE}, {page});
                    if (!cookies.docs.length) {
                        isNext = false;
                    } else {
                        // eslint-disable-next-line no-await-in-loop
                        await Promise.all(
                            cookies.docs.map((cookie) => {
                                return messageQueue.send(MQ_CHECK_COOKIE, {
                                    id: cookie.id,
                                });
                            })
                        );
                    }
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('schedule-bypass', err);
        await timeout(5000);
        process.exit(1);
    }
})();
