import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Setting from './model';

class SettingRepository extends DataRepository {}

const settingRepository = new SettingRepository(mongoProvider.bindingModel(Setting));
export default settingRepository;
