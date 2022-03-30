import moment from 'moment';
import {toSlug} from '@azteam/util';
import HttpClient from '@azteam/http-client';

class CrawlerGogoanime {
    constructor(endpoint = 'https://www2.gogoanime.cm') {
        this.endpoint = endpoint;
        this.client = new HttpClient({
            timeout: 20 * 1000,
        });
    }

    bypassCloudflare(url) {
        return this.client.responseDOM().post(`${process.env.BYPASS_URL}/cloudflare/${encodeURIComponent(url)}`);
    }

    async getTotalPageAnime() {
        try {
            const pageList = [];
            let page = 1;
            do {
                if (pageList.length !== 0) {
                    page = Math.max(...pageList);
                }
                const url = `${this.endpoint}/anime-list.html?page=${page}`;
                const html = await this.bypassCloudflare(url);
                const href = html.querySelectorAll('.pagination-list a');
                for (let i = 0; i < href.length; i += 1) {
                    pageList.push(href[i].getAttribute('href').replace('?page=', ''));
                }
            } while (page < Math.max(...pageList));

            return page;
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getListSlugAnimeOnPage(page) {
        const url = `${this.endpoint}/anime-list.html?page=${page}`;
        const html = await this.bypassCloudflare(url);
        const listItem = html.querySelectorAll('.main_body div.anime_list_body ul.listing li');

        return listItem.reverse().map((item) => {
            let slug = item.childNodes[item.childNodes.length - 2].getAttribute('href');
            if (slug.includes('/category/')) {
                slug = slug.replace('/category/', '');
            }
            return slug;
        });
    }

    async getDataAnimeBySlug(slug) {
        let result;
        const url = `${this.endpoint}/category/${slug}`;
        const html = await this.bypassCloudflare(url);
        if (html) {
            const animeThumb = html.querySelector('.anime_info_body_bg img');
            if (animeThumb) {
                result = {
                    slug,
                    thumb: animeThumb.getAttribute('src'),
                    name: html.querySelector('.anime_info_body_bg h1').text.trim(),
                };
                const items = html.querySelectorAll('.anime_info_body .anime_info_body_bg p.type');
                const listEpisodeGroup = html.querySelectorAll('#episode_page li');
                const isDub = html.querySelector('.anime_info_body_bg h1').text.includes('(Dub)');
                const lastEp = Number(listEpisodeGroup[listEpisodeGroup.length - 1].querySelector('a').text.split('-')[1]);
                const listEpisode = [];
                for (let i = 1; i <= lastEp; i += 1) {
                    if (isDub) {
                        listEpisode.push({slug: `${slug}-episode-${i}`, category: 'DUB'});
                    } else {
                        listEpisode.push({slug: `${slug}-episode-${i}`, category: 'SUB'});
                    }
                }
                result.episodes = listEpisode.map((episodes) => {
                    return {
                        slug: episodes.slug,
                        category: episodes.category,
                    };
                });
                items.map((item) => {
                    const matches = item.text
                        .split(/\s/)
                        .join(' ')
                        .trim()
                        .match(/(Type|Plot Summary|Genre|Released|Status|Other name):(.*)/);
                    if (matches) {
                        const key = matches[1];
                        const value = matches[2].trim();
                        switch (key) {
                            case 'Type':
                                result.type = value.split(' ')[value.split(' ').length - 1];
                                result.sub_category = {name: value, slug: toSlug(value)};
                                break;
                            case 'Genre':
                                result.genres = [];
                                if (value) {
                                    result.genres = value.split(',').map((genre) => {
                                        return {
                                            name: genre.trim(),
                                            slug: toSlug(genre),
                                        };
                                    });
                                }
                                break;
                            case 'Released':
                                result.released_year = moment(Number(value), 'YYYY').format('YYYY');
                                break;
                            case 'Status':
                                if (value === 'Completed') {
                                    result.anime_status = 1;
                                } else if (value === 'Ongoing') {
                                    result.anime_status = 0;
                                } else {
                                    result.anime_status = 2;
                                }
                                break;
                            case 'Plot Summary':
                                result.intro = value;
                                break;
                            case 'Other name':
                                result.other_name = value;
                                break;
                            default:
                        }
                    }
                    return true;
                });
            }
        }
        return result;
    }

    async getDataEpisodeBySlug(episodeSlug) {
        let result;
        const url = `${this.endpoint}/${episodeSlug}`;
        const html = await this.bypassCloudflare(url);
        if (html) {
            const hostedLinks = html.querySelectorAll('.anime_muti_link ul li');
            if (hostedLinks) {
                result = {
                    slug: episodeSlug,
                    type: 'SUB',
                    episode: null,
                };

                const type = html.querySelector('.anime_video_body .anime_video_body_cate .anime-info a');
                const downloadLink = html.querySelector('.anime_video_body .anime_video_body_cate .favorites_book ul li.dowloads a');
                if (downloadLink) {
                    result.download_slug = downloadLink.getAttribute('href');
                }
                if (type && type.text.includes('(Dub)')) {
                    result.type = 'DUB';
                }

                result.view = Math.floor(Math.random() * 400 + 100);
                const matches = episodeSlug.match(/-episode-(.*)/);
                if (matches) {
                    result.episode = Number(matches[1].replace('-', '.'));
                }
                result.is_latest = 0;
                const listEpisodeGroup = html.querySelectorAll('#episode_page li');
                if (listEpisodeGroup && listEpisodeGroup.length > 0) {
                    const lastEp = Number(listEpisodeGroup[listEpisodeGroup.length - 1].querySelector('a').text.split('-')[1]);
                    result.is_latest = 0;
                    if (result.episode >= lastEp) {
                        result.is_latest = 1;
                    }
                }

                result.hosted_links = await hostedLinks.map((liTag) => {
                    const item = liTag.querySelector('a');
                    return {
                        url: item.getAttribute('data-video'),
                        type: Number(item.getAttribute('rel')),
                    };
                });
            }
        }
        return result;
    }

    async getRecentRelease() {
        const url = `${this.endpoint}/anime-list.html`;
        const html = await this.bypassCloudflare(url);
        const listRecent = html.querySelectorAll('.menu_recent ul li');

        return listRecent.map((liTag) => {
            let episodeSlug = liTag.querySelector('a').getAttribute('href');
            let recentThumb = liTag.querySelector('.thumbnail-recent').getAttribute('style');
            const recentName = liTag.querySelector('.time_2').text.trim();
            recentThumb = recentThumb.split("'");
            episodeSlug = episodeSlug.replace(/\/(.*)\//, '');
            return {
                thumb: recentThumb[1],
                episodeSlug,
                name: recentName,
            };
        });
    }

    async getRecentAdded() {
        const url = `${this.endpoint}`;
        const html = await this.bypassCloudflare(url);
        const listRecent = html.querySelectorAll('.added_series_body ul.listing li');

        return listRecent.map((liTag) => {
            let recentSlug = liTag.querySelector('a').getAttribute('href');
            const recentName = liTag.querySelector('a').text.trim();
            recentSlug = recentSlug.replace(/\/(.*)\//, '');
            return {
                slug: recentSlug,
                name: recentName,
            };
        });
    }

    async getTotalPagePopularAnime() {
        try {
            const pageList = [];
            let page = 1;
            do {
                if (pageList.length !== 0) {
                    page = Math.max(...pageList);
                }
                const url = `${this.endpoint}/popular.html?page=${page}`;
                const html = await this.bypassCloudflare(url);
                const href = html.querySelectorAll('.pagination-list a');
                for (let i = 0; i < href.length; i += 1) {
                    pageList.push(href[i].getAttribute('href').replace('?page=', ''));
                }
            } while (page < Math.max(...pageList));

            return page;
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getPopularAnimeOnPage(page) {
        const url = `${this.endpoint}/popular.html?page=${page}`;
        const html = await this.bypassCloudflare(url);
        const listRecent = html.querySelectorAll('.last_episodes ul.items li');

        return listRecent.map((liTag, index) => {
            let popularSlug = liTag.querySelector('.name a').getAttribute('href');
            const popularThumb = liTag.querySelector('img').getAttribute('src');
            const popularName = liTag.querySelector('p.name').text.trim();
            const releaseDate = liTag.querySelector('p.released').text.split(' ')[1];
            popularSlug = popularSlug.replace(/\/(.*)\//, '');
            if (popularSlug.includes('/category/')) {
                popularSlug = popularSlug.replace('/category/', '');
            }
            const randomInt = Math.floor(Math.random() * 100) + 100;
            const popularView = 2032000 + (508 - page) * 4000 + (listRecent.length - (index + 1)) * 200 + randomInt - 2032000;

            return {
                thumb: popularThumb,
                slug: popularSlug,
                name: popularName,
                released_at: releaseDate,
                view: popularView,
            };
        });
    }

    async getTotalPageChineseAnimeEpisode() {
        try {
            const pageList = [];
            let page = 1;
            do {
                if (pageList.length !== 0) {
                    page = Math.max(...pageList);
                }
                const url = `https://ajax.gogo-load.com/ajax/page-recent-release.html?page=${page}&type=3`;
                const html = await this.bypassCloudflare(url);
                const href = html.querySelectorAll('.pagination-list a');

                for (let i = 0; i < href.length; i += 1) {
                    pageList.push(href[i].getAttribute('href').replace('?page=', ''));
                }
            } while (page < Math.max(...pageList));
            return page;
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getChineseAnimeEpisodeOnPage(page) {
        const url = `https://ajax.gogo-load.com/ajax/page-recent-release.html?page=${page}&type=3`;
        const html = await this.bypassCloudflare(url);
        const listRecent = html.querySelectorAll('.last_episodes ul.items li');
        return listRecent.map((liTag) => {
            let chineseSlug = liTag.querySelector('.name a').getAttribute('href');
            chineseSlug = chineseSlug.replace(/\/(.*)\//, '');
            if (chineseSlug.includes('/category/')) {
                chineseSlug = chineseSlug.replace('/category/', '');
            }
            return {
                slug: chineseSlug,
            };
        });
    }

    async getTotalPageRecentAnimeEpisode() {
        try {
            const pageList = [];
            let page = 1;
            do {
                if (pageList.length !== 0) {
                    page = Math.max(...pageList);
                }
                const url = `https://ajax.gogo-load.com/ajax/page-recent-release.html?page=${page}&type=1`;
                const html = await this.bypassCloudflare(url);
                const href = html.querySelectorAll('.pagination-list a');

                for (let i = 0; i < href.length; i += 1) {
                    pageList.push(href[i].getAttribute('href').replace('?page=', ''));
                }
            } while (page < Math.max(...pageList));
            return page;
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getRecentAnimeEpisodeOnPage(page) {
        const url = `https://ajax.gogo-load.com/ajax/page-recent-release.html?page=${page}&type=1`;
        const html = await this.bypassCloudflare(url);
        const listRecent = html.querySelectorAll('.last_episodes ul.items li');
        return listRecent.map((liTag) => {
            let chineseSlug = liTag.querySelector('.name a').getAttribute('href');
            chineseSlug = chineseSlug.replace(/\/(.*)\//, '');
            if (chineseSlug.includes('/category/')) {
                chineseSlug = chineseSlug.replace('/category/', '');
            }
            return {
                slug: chineseSlug,
            };
        });
    }
}

export default CrawlerGogoanime;
