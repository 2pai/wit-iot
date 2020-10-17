import express, { NextFunction } from 'express';
import wit from './wit';
import mqtt from './mqtt';
import controller from './controller';
import mongo from './mongo';
import bp from 'body-parser';
import path from 'path';
import config from './config';


const app = express();
const cors = require('cors')

app.use(cors())
app.use(bp.json())
app.get('/', async (req,res) => {
    res.send('This app is running properly')
})
app.get('/dashboard', (req,res) => {
    res.sendFile(path.join(__dirname , '../frontend' ,'index.html'))
})
app.post('/send', async (req,res) => {
    const {message} = req.body
    const payload = await wit.get(message)
    console.log(payload)
    controller.execute(payload)
    
    res.send("ok")
})

app.get('/sensor-data', async (req,res) => {
    try {
        const data = await mongo.sensorModel
        .find({})
        .limit(5)
        .sort({'date': -1})

        res.status(200).json(data)
    } catch (error) {
        res.status(400).json({msg:"Error"})
    }
})
app.listen(config.port, () => {
    mongo.init()
    mqtt.sub("pompa-report")
    console.log(`This app runs on ${config.port}`)
})