import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import SubCategory from './model';

class SubCategoryRepository extends DataRepository {}

const subCategoryRepository = new SubCategoryRepository(mongoProvider.bindingModel(SubCategory));
export default subCategoryRepository;
