import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import UserLog from './model';

class UserLogRepository extends DataRepository {
    clearLogsByUser(userId) {
        const Model = this.getModel();
        return Model.deleteMany({created_id: userId});
    }

    removeToken(id) {
        const Model = this.getModel();
        return Model.deleteOne({_id: id});
    }
}

const userLogRepository = new UserLogRepository(mongoProvider.bindingModel(UserLog));
export default userLogRepository;
