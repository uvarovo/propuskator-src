import Base        from '../../Base';
import AccessTokenReader from '../../../models/AccessTokenReader';
import { readerPhoneNumbers } from '../../../config';

export default class ListPhoneNumbers extends Base {
    async execute() {
        const phoneNumbersArr = readerPhoneNumbers.split(',').map(this._removePlus);

        if (!phoneNumbersArr || !phoneNumbersArr.length) return [];

        let usedPhones = await AccessTokenReader.getAllUsedPhones(phoneNumbersArr) || [];

        usedPhones = usedPhones.map(this._removePlus);

        const notUsedPhones = phoneNumbersArr.filter(p => usedPhones.includes(p) === false);

        return { data: notUsedPhones };
    }

    _removePlus(phoneNumber) {
        const trimmedPhn = phoneNumber.trim();

        return trimmedPhn.split('')[0] === '+' ? trimmedPhn.slice(1) : trimmedPhn;
    }
}
