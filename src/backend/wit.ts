import {Wit} from 'node-wit';
import config from './config';

const client = new Wit({
    accessToken: config.witToken,
})

const get = async (message: string) => {
    try {
        const data = await client.message(message,{});
        return data;
    } catch (error) {
        return error;
    }
}

export default {
    get
}