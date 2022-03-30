import bcrypt from 'bcryptjs';
import {generateOTP, generateSecretKeyOTP, md5, verifyOTP} from '@azteam/crypto';
import {createSchema, MongoDataTypes as DataTypes, MongoDefaultAttributes as DefaultAttributes, MongoModel as Model} from '@azteam/mongo-model';

import {GENDER} from 'src/constants/variable';
import {USER_LEVEL} from 'src/constants/system';
import {ACCOUNT_STATUS, BOOLEAN_STATUS} from 'src/constants/status';

export default class User extends Model {
    beforeSave() {
        if (this.email) {
            this.email = this.email.toLowerCase();
        }
        super.beforeSave();
    }

    beforeCreate() {
        if (this.password) {
            this.hashPassword();
        }
        const account = this.email || this.phone_number;
        this.api_key = md5(account + Date.now());
        this.secret_key_otp = generateSecretKeyOTP();

        super.beforeCreate();
    }

    hashPassword() {
        this.password = bcrypt.hashSync(this.password, 10);
    }

    verifyOTP(otp, ttlMinutes) {
        return verifyOTP(this.secret_key_otp, otp, ttlMinutes);
    }

    generateOTP(ttlMinutes) {
        return generateOTP(this.secret_key_otp, ttlMinutes);
    }

    comparePassword(checkPassword) {
        return checkPassword && this.password ? bcrypt.compareSync(checkPassword, this.password) : false;
    }
}

User.database_name = 'account';
User.table_name = 'user';
User.schema = createSchema({
    email: {
        type: DataTypes.STRING,
    },
    phone_number: {
        type: DataTypes.STRING,
    },
    password: {
        type: DataTypes.STRING,
    },
    facebook_id: {
        type: DataTypes.STRING,
    },
    google_id: {
        type: DataTypes.STRING,
    },
    apple_id: {
        type: DataTypes.STRING,
    },
    api_key: {
        type: DataTypes.STRING,
    },
    secret_key_otp: {
        type: DataTypes.STRING,
    },
    level: {
        type: DataTypes.NUMBER,
        default: USER_LEVEL.USER,
    },
    name: {
        type: DataTypes.STRING,
    },
    avatar: {
        type: DataTypes.STRING,
        default: 'avatar.jpg',
    },
    gender: {
        type: DataTypes.NUMBER,
        default: GENDER.UNKNOWN,
    },
    address: {
        type: DataTypes.STRING,
    },
    position_id: {
        type: DataTypes.ID,
    },
    district_id: {
        type: DataTypes.NUMBER,
    },
    province_id: {
        type: DataTypes.NUMBER,
    },
    identity_id: {
        type: DataTypes.STRING,
    },
    is_verify_email: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
    },
    is_verify_phone: {
        type: DataTypes.NUMBER,
        default: BOOLEAN_STATUS.FALSE,
    },

    online_at: {
        type: DataTypes.NUMBER,
        default: 0,
    },
    status: {
        type: DataTypes.NUMBER,
        default: ACCOUNT_STATUS.NOT_VERIFIED,
        index: true,
    },
    ...DefaultAttributes.SOFT_DELETE,
});

User.schema.virtual('has_password').get(function () {
    return this.password ? BOOLEAN_STATUS.TRUE : BOOLEAN_STATUS.FALSE;
});
