import _ from 'lodash';
import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {BOOLEAN_STATUS} from 'src/constants/status';

import {mongoProvider} from 'src/providers';
import Version from './model';

class VersionRepository extends DataRepository {
    async findInit(type) {
        const versions = await this.find({
            [`is_${type}`]: BOOLEAN_STATUS.TRUE,
        });

        return _.reduce(
            versions,
            function (obj, param) {
                // eslint-disable-next-line no-param-reassign
                obj[param.key] = param.version;
                return obj;
            },
            {}
        );
    }
}

const versionRepository = new VersionRepository(mongoProvider.bindingModel(Version));
export default versionRepository;
