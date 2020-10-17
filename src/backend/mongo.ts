import mongoose from 'mongoose'
import config from './config';

const { Schema,model,connect } = mongoose;

const init = () => {
    connect(config.mongoURI, {useNewUrlParser: true, useUnifiedTopology: true})
}

const sensorSchema = new Schema({
    deviceName: String,
    payload: Object,
    date: { type: Date, default: Date.now }
})

const sensorModel = model('sensor',sensorSchema)

export default {
    init,
    sensorModel
}