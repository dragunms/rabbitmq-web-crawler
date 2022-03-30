import {toSlug} from '@azteam/util';
import HttpClient from '@azteam/http-client';

class CrawlerAnimeflv {
    constructor(endpoint = 'https://www3.animeflv.net') {
        this.endpoint = endpoint;
        this.client = new HttpClient({
            timeout: 20 * 1000,
        });
    }

    bypassCloudflare(url) {
        return this.client.responseDOM().post(`${process.env.BYPASS_URL}/cloudflare/${encodeURIComponent(url)}`);
    }

    bypassResponseFullCloudflare(url) {
        return this.client.responseFull().post(`${process.env.BYPASS_URL}/cloudflare/${encodeURIComponent(url)}`);
    }

    async getTotalPageAnime() {
        try {
            let lastPage = 1;
            const pageList = [];
            const url = `${this.endpoint}/browse`;
            const html = await this.bypassCloudflare(url);
            const href = html.querySelectorAll('.pagination li');
            for (let i = 0; i < href.length; i += 1) {
                if (href[i].childNodes[0].getAttribute('href')) {
                    pageList.push(href[i].childNodes[0].getAttribute('href').replace(/\D+/, ''));
                }
            }
            lastPage = Math.max(...pageList);

            return lastPage;

            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getListSlugAnimeOnPage(page) {
        const url = `${this.endpoint}/browse?page=${page}`;
        const html = await this.bypassCloudflare(url);
        const listItem = html.querySelectorAll('.Wrapper main .ListAnimes li');

        return listItem.reverse().map((item) => {
            const content = item.querySelector('article').querySelector('a');
            let slug = content.getAttribute('href');
            if (slug.includes('/anime/')) {
                slug = slug.replace('/anime/', '');
            }
            return slug;
        });
    }

    async getDataAnimeBySlug(slug) {
        let result;
        const url = `${this.endpoint}/anime/${slug}`;
        const html = await this.bypassCloudflare(url);
        const fullHtml = await this.bypassResponseFullCloudflare(url);

        const thumbSlug = html.querySelector('.AnimeCover .Image img');
        const backgroundSlug = html.querySelector('.Ficha .Bg');
        const animeName = html.querySelector('.Ficha .Container h1.Title');
        if (thumbSlug && backgroundSlug && animeName) {
            result = {
                slug,
                thumb: thumbSlug.getAttribute('src'),
                background: backgroundSlug.getAttribute('style').replace('background-image:url(', '').slice(0, -1),
                name: animeName.text,
            };
            const relatedAnimeList = html.querySelectorAll('ul.ListAnmRel li');
            const otherNameList = html.querySelectorAll('.Ficha .Container span.TxtAlt');
            const genreList = html.querySelectorAll('.Main nav.Nvgnrs a');
            const status = html.querySelector('.Container .AnmStts span').text;
            result.type = html.querySelector('.Ficha .Container span.Type').text;
            const scriptContentList = fullHtml.body.match(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/g);

            result.episodes = [];
            if (scriptContentList) {
                for (let i = 0; i < scriptContentList.length; i += 1) {
                    if (scriptContentList[i].includes('var episodes')) {
                        const list = scriptContentList[i].match(/\[.*\]/g);
                        const episodeData = JSON.parse(list[1]);
                        const animeData = JSON.parse(list[0]);
                        result.episodes = episodeData
                            .map((item) => {
                                return {slug: toSlug(`${animeData[2]}-${item[0]}`), name: item[0].toString().trim()};
                            })
                            .reverse();
                    }
                }
            }

            result.other_name = [];
            if (otherNameList.length > 0) {
                for (let i = 0; i < otherNameList.length; i += 1) {
                    result.other_name.push(otherNameList[i].text);
                }
            }

            result.genres = [];
            if (genreList.length > 0) {
                for (let i = 0; i < genreList.length; i += 1) {
                    result.genres.push({name: genreList[i].text, slug: toSlug(genreList[i].text)});
                }
            }

            result.description = html.querySelector('.Main .Description p').text;

            result.votes = html.querySelector('.Votes #votes_prmd').text;

            result.related_anime = [];
            if (relatedAnimeList > 0) {
                for (let i = 0; i < relatedAnimeList.length; i += 1) {
                    const relatedAnimeName = relatedAnimeList[i].querySelector('a');
                    const relatedAnimeType = relatedAnimeList[i].text.replace(relatedAnimeList[i].querySelector('a').text, '').trim();

                    result.related_anime.push({name: relatedAnimeName.text, slug: toSlug(relatedAnimeName.text), type: relatedAnimeType});
                }
            }
            switch (status) {
                case 'Proximamente':
                    result.anime_status = 2;
                    break;
                case 'Finalizado':
                    result.anime_status = 1;
                    break;
                case 'En emision':
                    result.anime_status = 0;
                    break;
                default:
                    result.anime_status = 0;
            }
        }
        return result;
    }

    async getDataEpisodeBySlug(episodeSlug) {
        const result = {
            slug: episodeSlug,
            type: 'SUB',
            episode: null,
        };
        const url = `${this.endpoint}/ver/${episodeSlug}`;
        const html = await this.bypassCloudflare(url);
        const fullHtml = await this.bypassResponseFullCloudflare(url);
        const NextEpisode = html.querySelector('#XpndCn .CpCnB .CapOptns .CapNv a.CapNvNx');
        const downloadList = html.querySelectorAll('#DwsldCn .Dwnl tbody tr');
        const matches = episodeSlug.match(/-episode-(.*)/);

        if (matches) {
            result.episode = Number(matches[1].replace('-', '.'));
        }

        result.is_latest = 0;

        if (!NextEpisode) {
            result.is_latest = 1;
        }

        result.hosted_links = [];
        result.download_slug = [];

        if (downloadList) {
            result.download_slug = downloadList.map((rowItem) => {
                const row = rowItem.querySelectorAll('td');
                return {name: row[0].innerText, format: row[1].innerText, type: row[2].innerText, url: row[3].getAttribute('href')};
            });
        }

        const scriptContentList = fullHtml.body.match(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/g);

        if (scriptContentList) {
            for (let i = 0; i < scriptContentList.length; i += 1) {
                if (scriptContentList[i].includes('var videos')) {
                    const list = scriptContentList[i].match(/\{.*\}/g)[0];
                    const data = JSON.parse(list);
                    result.hosted_links = Object.keys(data).reduce(function (r, k) {
                        const tempData = data[k].map((item) => {
                            console.log(item);
                            return {name: item.title, url: item.code, type: k};
                        });
                        return r.concat(tempData);
                    }, []);
                }
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
            const recentName = liTag.querySelector('.time_2').text;
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
            const recentName = liTag.querySelector('a').text;
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

        return listRecent.map((liTag) => {
            let popularSlug = liTag.querySelector('.name a').getAttribute('href');
            const popularThumb = liTag.querySelector('img').getAttribute('src');
            const recentName = liTag.querySelector('p.name').text;
            const releaseDate = liTag.querySelector('p.released').text.split(' ')[1];
            popularSlug = popularSlug.replace(/\/(.*)\//, '');
            if (popularSlug.includes('/category/')) {
                popularSlug = popularSlug.replace('/category/', '');
            }
            return {
                thumb: popularThumb,
                slug: popularSlug,
                name: recentName,
                released_at: releaseDate,
            };
        });
    }
}

export default CrawlerAnimeflv;
