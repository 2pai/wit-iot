import * as dotenv from 'dotenv';
dotenv.config();

export default {
    mongoURI: process.env.MONGO_URI ?? '',
    mqttURI: process.env.MQTT_URI ?? '',
    witToken: process.env.WIT_TOKEN ?? '',
    port: process.env.PORT ?? 3000
}
