import {execSync} from 'child_process';
import {timeout} from '@azteam/util';
import scheduleUnique, {_1_MINUTE} from '@azteam/schedule-unique';

import {sendErrorMessage} from 'src/modules/message';

import {HEALTH_REDIS} from 'src/apps/health/constants/schedule';

(async () => {
    try {
        scheduleUnique.addSchedule(
            HEALTH_REDIS,
            _1_MINUTE,
            60,
            async function () {
                try {
                    execSync('redis-cli ping');
                } catch (err) {
                    execSync('systemctl restart redis');
                    execSync('redis-cli config set stop-writes-on-bgsave-error no');
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
