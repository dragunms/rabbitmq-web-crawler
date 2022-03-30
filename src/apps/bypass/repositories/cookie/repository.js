import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Cookie from './model';

class CookieRepository extends DataRepository {}

const cookieRepository = new CookieRepository(mongoProvider.bindingModel(Cookie));
export default cookieRepository;
