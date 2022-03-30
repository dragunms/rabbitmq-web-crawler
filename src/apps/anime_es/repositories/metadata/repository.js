import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import Metadata from './model';

class MetadataRepository extends DataRepository {
    findInit() {
        return this.find({});
    }
}

const metadataRepository = new MetadataRepository(mongoProvider.bindingModel(Metadata));
export default metadataRepository;
