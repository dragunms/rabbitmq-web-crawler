import moment from 'moment';
import {toSlug} from '@azteam/util';
import HttpClient from '@azteam/http-client';

class CrawlerDramanice {
    constructor(endpoint = 'https://dramanice.so') {
        this.endpoint = endpoint;
        this.client = new HttpClient({
            timeout: 20 * 1000,
        });
    }

    bypassCloudflare(url) {
        return this.client.responseDOM().get(`${process.env.BYPASS_URL}/cloudflare/${encodeURIComponent(url)}`);
    }

    async getTotalPageStar() {
        try {
            const url = `${this.endpoint}/most-popular-star`;
            const html = await this.bypassCloudflare(url);

            const href = html.querySelector('.pagination-list .last a').getAttribute('href');
            if (href.includes('?page=')) {
                return href.replace('?page=', '');
            }
            // eslint-disable-next-line no-empty
        } catch (e) {}
        return 0;
    }

    async getListSlugStarOnPage(page) {
        const url = `${this.endpoint}/most-popular-star?page=${page}`;
        const html = await this.bypassCloudflare(url);

        const listItem = html.querySelectorAll('ul.items li');

        return listItem.reverse().map((item) => {
            let slug = item.querySelector('a').getAttribute('href');
            if (slug.includes('/star/')) {
                slug = slug.replace('/star/', '');
            }
            return slug;
        });
    }

    async getDataStarBySlug(slug) {
        const url = `${this.endpoint}/star/${slug}`;
        const html = await this.bypassCloudflare(url);

        const result = {
            slug,
            thumb: html.querySelector('.drama_info_body_bg img').getAttribute('src'),
            name: html.querySelector('h1.label_coming').text,
        };

        const items = html.querySelectorAll('.info_right p');

        items.map((item) => {
            const matches = item.text.match(/(Other Name|Born|Address|Height):(.*)/);

            if (matches) {
                const key = matches[1];
                const value = matches[2].trim();

                switch (key) {
                    case 'Other Name':
                        result.other_name = value;
                        break;
                    case 'Born':
                        result.birthday_at = moment(value, 'MMM, DD, YYYY').unix();
                        break;
                    case 'Address':
                        result.address = value;
                        break;
                    case 'Height':
                        result.height = value.replace(' CM', '');
                        break;
                    default:
                }
            }

            return true;
        });

        return result;
    }

    async getAllMovie() {
        const url = `${this.endpoint}/list-all-drama`;
        const html = await this.bypassCloudflare(url);

        const listItem = html.querySelectorAll('.country-all');
        return listItem.reverse().map((item) => {
            let slug = item.querySelector('a').getAttribute('href');
            if (slug.includes('/drama/')) {
                slug = slug.replace('/drama/', '');
                slug = slug.replace(/-detail$/, '');
            }
            return slug;
        });
    }

    async getLatestEpisodes() {
        const url = `${this.endpoint}/page-recent-release.html?page=1&type=1`;
        const html = await this.bypassCloudflare(url);
        const listEpisode = html.querySelectorAll('.items li');

        return listEpisode.map((liTag) => {
            let episodeSlug = liTag.querySelector('a').getAttribute('href');
            if (episodeSlug.includes('/watch-')) {
                const matches = episodeSlug.match(/\/(.*)\//);
                const movieSlug = matches[1];

                episodeSlug = episodeSlug.replace(/\/(.*)\//, '');
                episodeSlug = episodeSlug.replace('watch-', '');
                episodeSlug = episodeSlug.replace('-online', '');
                return {
                    movieSlug,
                    episodeSlug,
                };
            }
            return null;
        });
    }

    async getDataMovieBySlug(slug) {
        const url = `${this.endpoint}/drama/${slug}-detail`;
        const html = await this.bypassCloudflare(url);

        const result = {
            slug,
            thumb: html.querySelector('.img_cover img').getAttribute('src'),
            name: html.querySelector('h1.label_coming').text,
            intro: html.querySelector('.info_des').text,
            other_name: html
                .querySelectorAll('.other_name a')
                .map((a) => a.text.trim())
                .join(', '),
        };

        const infoItems = html.querySelectorAll('.info_right p');
        infoItems.map((item) => {
            const matches = item.text.match(/(Director|Status|Released|Genre|Country):(.*)/);

            if (matches) {
                const key = matches[1];
                const value = matches[2].trim();

                switch (key) {
                    case 'Director':
                        result.director = value;
                        break;
                    case 'Status':
                        result.movie_status = value;
                        break;
                    case 'Released':
                        result.released_year = value;
                        break;
                    case 'Genre':
                        result.genres = [];
                        if (value) {
                            result.genres = value.split(',').map((genre) => {
                                return {
                                    name: genre,
                                    slug: toSlug(genre),
                                };
                            });
                        }
                        break;
                    case 'Country':
                        result.country = {
                            name: value,
                            slug: toSlug(value),
                        };
                        break;
                    default:
                }
            }

            return true;
        });

        const listStar = html.querySelectorAll('.listpopular li');
        result.stars = listStar.map((liTag) => {
            const starSlug = liTag.querySelector('a').getAttribute('href');
            if (starSlug.includes('/star/')) {
                return {
                    slug: starSlug.replace('/star/', ''),
                    name: liTag.querySelector('a').getAttribute('title'),
                    thumb: liTag.querySelector('a img').getAttribute('src'),
                };
            }
            return null;
        });

        const listEpisode = html.querySelectorAll('.list_episode li');
        result.episodes = listEpisode.map((liTag) => {
            let episodeSlug = liTag.querySelector('a').getAttribute('href');
            if (episodeSlug.includes('/watch-')) {
                episodeSlug = episodeSlug.replace(/\/(.*)\//, '');
                episodeSlug = episodeSlug.replace('watch-', '');
                episodeSlug = episodeSlug.replace('-online', '');
                return {
                    slug: episodeSlug,
                };
            }
            return null;
        });

        return result;
    }

    async getDataEpisodeBySlug(movieSlug, episodeSlug) {
        const result = {
            slug: episodeSlug,
            type: 'SUB',
            episode: null,
        };

        const url = `${this.endpoint}/${movieSlug}/watch-${episodeSlug}-online`;
        const html = await this.bypassCloudflare(url);

        if (html.querySelector('.info_bottom .here')) {
            result.type = 'RAW';
        }

        const matches = episodeSlug.match(/-episode-(.*)/);
        if (matches) {
            result.episode = Number(matches[1].replace('-', '.'));
        }

        const hostedLinks = html.querySelectorAll('.anime_muti_link li');
        result.hosted_links = hostedLinks.map((liTag) => {
            return {
                url: liTag.getAttribute('data-video'),
                type: Number(liTag.getAttribute('rel')),
            };
        });

        return result;
    }
}

export default CrawlerDramanice;
