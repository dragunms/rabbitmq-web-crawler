import {schemaEmail, schemaOTP, schemaPassword, schemaString} from 'src/constants/validate';

export const rulesSendOTPEmail = {
    email: schemaEmail(),
};

export const rulesLogin = {
    username: schemaString(),
    password: schemaPassword(),
};

export const rulesLoginByEmail = {
    email: schemaEmail(),
    password: schemaPassword(),
};

export const rulesVerifyEmail = {
    email: schemaEmail(),
    otp: schemaOTP(),
};

export const rulesVerifyEmailHash = {
    hash: schemaString(),
};

export const rulesRegisterByEmail = {
    email: schemaEmail(),
    password: schemaPassword(),

    name: schemaString(1, 50, true),
};

export const rulesLoginSocial = {
    token: schemaString(0, 5000),

    name: schemaString(1, 255, true),
};

export const rulesResetPassword = {
    email: schemaEmail(),
    otp: schemaOTP(),
    new_password: schemaPassword(),
};

export const rulesRefreshToken = {
    token: schemaString(),
};
