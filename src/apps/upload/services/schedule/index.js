import fs from 'fs';
import moment from 'moment';
import {timeout} from '@azteam/util';
import scheduleUnique, {_1_DAY} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';

import {CLEAN_TEMPS_FOLDER} from 'src/apps/upload/constants/service';

(async () => {
    try {
        scheduleUnique.addSchedule(
            CLEAN_TEMPS_FOLDER,
            _1_DAY,
            120,
            async function () {
                const timeAgo = moment().subtract(2, 'hours').unix();

                // eslint-disable-next-line no-restricted-syntax
                for (const dirName of fs.readdirSync(process.env.TEMPS_DIR)) {
                    if (timeAgo > moment(dirName, 'D/M/YYYY').unix()) {
                        // execSync(`rm -rf ${process.env.TEMPS_DIR}/${dirName}`);
                    }
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('schedule-health', err);
        await timeout(5000);
        process.exit(1);
    }
})();
