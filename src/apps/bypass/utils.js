import _ from 'lodash';
import fs from 'fs';
import psl from 'psl';
import puppeteerCore from 'puppeteer';
import {addExtra} from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import proxyChain from 'proxy-chain';
import HttpClient from '@azteam/http-client';

import {MQ_COUNT_COOKIE} from 'src/apps/bypass/constants/service';

import cookieRepository from 'src/apps/bypass/repositories/cookie/repository';
import {messageQueueProvider, PROVIDER} from 'src/providers';
import {AVAILABLE_STATUS} from 'src/constants/status';

const defaultCustomRequest = {method: 'GET', body: {}, headers: {}};

export async function getIPByProxy(proxy) {
    try {
        const configProxy = {
            host: proxy.ip,
            port: proxy.port,
        };
        if (proxy.username) {
            configProxy.auth = {
                username: proxy.username,
                password: proxy.password,
            };
        }
        const client = new HttpClient({proxy: configProxy});
        const response = await client.get('https://ipv4bot.whatismyipaddress.com/');
        return response.trim();
    } catch (e) {
        return null;
    }
}

export function getClientByCookie(cookie) {
    const clientOptions = {};

    clientOptions.cookieFile = `${process.env.STORAGE_DIR}/cookies/${cookie.domain}_${cookie.proxy.ip}_${cookie.version}.json`;
    if (!fs.existsSync(clientOptions.cookieFile)) {
        fs.writeFileSync(clientOptions.cookieFile, cookie.data);
    }

    clientOptions.headers = {
        'User-Agent': cookie.agent,
    };

    clientOptions.proxy = {
        host: cookie.proxy.ip,
        port: cookie.proxy.port,
    };
    if (cookie.proxy.username) {
        clientOptions.proxy.auth = {
            username: cookie.proxy.username,
            password: cookie.proxy.password,
        };
    }
    return new HttpClient(clientOptions);
}

export async function retryWithCookie(url, cookie, customRequest = defaultCustomRequest) {
    let html = null;
    if (cookie.status === AVAILABLE_STATUS.AVAILABLE) {
        try {
            const client = getClientByCookie(cookie);

            _.map(customRequest.headers, (value, key) => {
                client.addHeader(key, value);
            });

            if (customRequest.method === 'POST') {
                html = await client.post(url, customRequest.body);
            } else {
                html = await client.get(url);
            }

            if (!html.match(/challenge-form/g)) {
                return html;
            }
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }
    return html;
}

export async function retryWithPuppeteer(url, cookie, customRequest = defaultCustomRequest) {
    const puppeteer = addExtra(puppeteerCore);
    const stealth = StealthPlugin();
    puppeteer.use(stealth);

    let proxyString = `${cookie.proxy.ip}:${cookie.proxy.port}`;
    if (cookie.proxy.username) {
        proxyString = `${cookie.proxy.username}:${cookie.proxy.password}@${proxyString}`;
    }
    proxyString = await proxyChain.anonymizeProxy(`http://${proxyString}`);

    let html = false;

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', `--proxy-server=${proxyString}`, `--user-agent=${cookie.agent}`],
    });

    try {
        const page = await browser.newPage();

        const cookieFile = `${process.env.STORAGE_DIR}/cookies/${cookie.domain}_${cookie.proxy.ip}_puppeteer.json`;
        if (fs.existsSync(cookieFile)) {
            const cookiesString = fs.readFileSync(cookieFile);
            const cookies = JSON.parse(cookiesString);
            await page.setCookie(...cookies);
        }
        await page.setViewport({width: 1280, height: 800});

        const session = await page.target().createCDPSession();
        await session.send('Page.enable');
        await session.send('Page.setWebLifecycleState', {state: 'active'});

        await page.setRequestInterception(true);
        page.once('request', (interceptedRequest) => {
            const postData = new URLSearchParams(customRequest.body).toString();

            const data = {
                method: customRequest.method,
                postData,
                headers: {
                    ...interceptedRequest.headers(),
                    ...customRequest.headers,
                },
            };

            interceptedRequest.continue(data);

            page.setRequestInterception(false);
        });

        const response = await page.goto(url);

        html = await page.content();

        if (html.match(/id="cf-spinner-allow-5-secs"/)) {
            await page.waitForTimeout(25000);

            html = await page.content();
        }

        if (!html.match(/challenge-form/g)) {
            const cookies = await page.cookies();
            await fs.writeFileSync(cookieFile, JSON.stringify(cookies, null, 2));

            if (url.match(/\.(jpg|png|gif|jpeg)/)) {
                return await response.buffer();
            }

            return html;
        }

        return html;

        // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
        await browser.close();
    }
    return null;
}

export async function bypassCloudflare(url, customRequest = defaultCustomRequest) {
    let html = null;

    const urlParser = new URL(url);
    const {domain} = psl.parse(urlParser.host);

    const cookie = await cookieRepository
        .findOne({
            domain,
        })
        .sort({
            status: -1,
            count: 1,
        });

    if (cookie) {
        if (!html) {
            try {
                html = await retryWithCookie(url, cookie, customRequest);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        }

        if (!html) {
            try {
                html = await retryWithPuppeteer(url, cookie, customRequest);
                // eslint-disable-next-line no-empty
            } catch (e) {}
        }

        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
        await messageQueue.send(MQ_COUNT_COOKIE, {
            id: cookie.id,
        });
    }

    return html;
}
