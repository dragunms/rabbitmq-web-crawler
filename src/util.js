import path from 'path';
import ejs from 'ejs';

export function renderTemplateFile(template, params = {}) {
    const TEMPLATE_DIR = path.resolve('src/templates');
    return ejs.renderFile(`${TEMPLATE_DIR}/${template}`, {
        ...params,
        homeName: process.env.SITE_NAME,
        homeUrl: process.env.HOME_URL,
        assetUrl: process.env.ASSET_URL,
    });
}
