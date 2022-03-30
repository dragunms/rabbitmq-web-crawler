import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Proxy from './model';

class ProxyRepository extends DataRepository {}

const proxyRepository = new ProxyRepository(mongoProvider.bindingModel(Proxy));
export default proxyRepository;
