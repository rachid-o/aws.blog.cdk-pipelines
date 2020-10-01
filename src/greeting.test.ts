import {handler} from './greeting'

describe('Test calculationHandler', function () {
    it('Happy flow', async () => {
        let emptyBody = {};
        let event = {body: emptyBody };

        const result = await handler(event);
        expect(result.statusCode).toEqual(200);
    });
});
