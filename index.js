// eslint-disable-next-line no-global-assign
require = require('esm')(module);

const _ = require('lodash');
const fs = require('fs');
const mkdirp = require('mkdirp');

process.env.NODE_CONFIG_DIR = `${__dirname}/config/${process.env.NODE_PROJECT}`;

const config = require('config');

const envConfigs = config.get('ENV');

_.map(envConfigs, (value, key) => {
    if (Object.prototype.hasOwnProperty.call(envConfigs, key)) {
        process.env[key] = value;
    }
});

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'qwerty';
process.env.TZ = process.env.TZ || 'America/Los_Angeles';
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || 128;

if (process.env.NODE_ENV !== 'development') {
    console.log = function () {};
}

const folderDirs = [process.env.TEMPS_DIR, process.env.STORAGE_DIR, `${process.env.STORAGE_DIR}/cookies`];

_.map(['movie_en', 'drama_en', 'anime_en', 'movie_es', 'anime_es'], (folderName) => {
    folderDirs.push(`${process.env.STORAGE_DIR}/images/${folderName}`);
});

// eslint-disable-next-line no-restricted-syntax
for (const folderDir of folderDirs) {
    if (!fs.existsSync(folderDir)) {
        console.info(`create folder: ${folderDir}`);
        mkdirp.sync(folderDir);
    }
}

require('src/apps');
