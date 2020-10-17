import Mqtt from "mqtt";
import mongo from "./mongo";
import config from './config';

const client = Mqtt.connect(config.mqttURI,{
    queueQoSZero:false
})
  
const pub = (topic:string, message: any) => {
    client.publish(topic,message,{qos:2})
}

const sub = (topic:string) => {
    client.subscribe(topic,{qos:2})
}

client.on('message', (topic, message) => {
    if (topic == 'pompa-report') {
        const payload = JSON.parse(message.toString())
        
        if(payload.kind == "pompa-stats") {

            const sensor = new mongo.sensorModel({
            deviceName: payload['deviceName'],
            payload: {
                hum:payload["humidity"],
                temp:payload["temperature"] 
                }    
            })

            pub("web",JSON.stringify({
                humidity:payload.humidity,
                temp:payload.temperature,
                date: Date.now()
            }))
            
            sensor.save()
        }
    }
})

export default {
    pub,
    sub
}