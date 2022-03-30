import _ from 'lodash';
import {GENDER} from 'src/constants/variable';
import {ACCOUNT_STATUS, AVAILABLE_STATUS, PRIVATE_STATUS} from 'src/constants/status';

export const ENUM_PLATFORM = ['web', 'app'];

export const ENUM_GENDER = _.values(GENDER);

export const ENUM_PRIVATE_STATUS = _.values(PRIVATE_STATUS);
export const ENUM_ACCOUNT_STATUS = _.values(ACCOUNT_STATUS);
export const ENUM_AVAILABLE_STATUS = _.values(AVAILABLE_STATUS);
