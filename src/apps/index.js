import Monitor from '@azteam/monitor';

import {sendErrorMessage} from 'src/modules/message';
import {closeAllProvider, waitRegisterProvider} from 'src/providers';

(async function () {
    try {
        await Monitor.getExternalIP();

        const services = JSON.parse(process.env.SERVICES);
        // eslint-disable-next-line global-require,import/no-dynamic-require
        const register = require(`src/apps/${process.env.APP}/register.js`).default;

        // eslint-disable-next-line no-restricted-syntax
        for (const service of services) {
            const serviceDir = `src/apps/${process.env.APP}/services/${service}`;

            // eslint-disable-next-line no-await-in-loop
            await waitRegisterProvider(register.providers, service);

            // eslint-disable-next-line global-require,import/no-dynamic-require
            require(serviceDir);
        }

        process.send('ready');

        process.on('SIGINT', () => {
            closeAllProvider();
        });
    } catch (err) {
        await sendErrorMessage('apps', err);
        process.exit(1);
    }
})();
