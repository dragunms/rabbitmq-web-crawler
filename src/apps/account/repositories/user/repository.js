import {MongoDataRepository as DataRepository} from '@azteam/mongo-model';

import {mongoProvider} from 'src/providers';

import User from './model';

class UserRepository extends DataRepository {
    findOneByEmail(email) {
        return this.findOne({
            email: email.toLowerCase(),
        });
    }

    findOneOrCreateByPhone(phoneNumber, data) {
        return this.findOneOrCreate(
            {
                phone_number: phoneNumber,
            },
            data
        );
    }

    findOneByRefreshToken(refreshToken) {
        return this.findOne({
            logs: {
                $elemMatch: {
                    _id: refreshToken,
                },
            },
        });
    }
}

const userRepository = new UserRepository(mongoProvider.bindingModel(User));
export default userRepository;
