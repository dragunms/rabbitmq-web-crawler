import {timeout} from '@azteam/util';

import {sendErrorMessage} from 'src/modules/message';

import {TTL_OTP} from 'src/constants/system';

import {messageQueueProvider, PROVIDER} from 'src/providers';

import {sendEmailByGmail} from 'src/modules/email';

import {MQ_SEND_FORGOT_EMAIL, MQ_SEND_VERIFY_EMAIL} from 'src/apps/account/constants/service';

import userRepository from 'src/apps/account/repositories/user/repository';

(async function () {
    try {
        const messageQueue = messageQueueProvider.getConnection(PROVIDER.RABBIT_MQ.SYSTEM);
        await messageQueue.receiving(
            MQ_SEND_VERIFY_EMAIL,
            async function (queueData) {
                const user = await userRepository.findOneByEmail(queueData.email);
                if (user) {
                    const options = {
                        template: 'verify_email',
                        to: user.email,
                        subject: 'Vui lòng xác nhận email của bạn',
                    };

                    const otp = user.generateOTP(TTL_OTP.EMAIL);

                    const params = {otp};

                    await sendEmailByGmail(options, params, function (err) {
                        if (err) {
                            sendErrorMessage('sendEmailByGmail', JSON.stringify(err));
                        }
                    });
                }
            },
            sendErrorMessage
        );

        await messageQueue.receiving(
            MQ_SEND_FORGOT_EMAIL,
            async function (queueData) {
                const user = await userRepository.findOneByEmail(queueData.email);
                if (user) {
                    const options = {
                        template: 'forgot_password',
                        to: user.email,
                        subject: 'Đặt lại mật khẩu',
                    };

                    const otp = user.generateOTP(TTL_OTP.EMAIL);
                    const params = {otp};

                    await sendEmailByGmail(options, params, function (err) {
                        if (err) {
                            sendErrorMessage('sendEmailByGmail', JSON.stringify(err));
                        }
                    });
                }
            },
            sendErrorMessage
        );
    } catch (err) {
        await sendErrorMessage('account-worker', err);
        await timeout(5000);
        process.exit(1);
    }
})();
