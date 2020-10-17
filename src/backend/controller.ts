import Mqtt from './mqtt'


const execute = (payload:any) => {

    const {intents, entities, traits} = payload;
    
    const intent = intents
        .filter((i:any) => i.confidence > 0.90)
        .map((i:any) => i.name)    

    const entity = entities["device:device"]
        .filter((device:any) => (device.confidence > 0.90))
        .map((d:any) =>  d.value)
        
    if(intent[0] == "set_device"){
        const trait = traits["wit$on_off"]
            .filter((t:any) => t.confidence > 0.90)
            .map((obj:any) => obj.value)

        const status = trait[0] == "on" ? "1" : "0"
        Mqtt.pub(entity[0],status)
    }else if(intent[0] == "get_device") {
        Mqtt.pub("pompa-stats","1")
    }else{
        console.log("not found")
    }
}

export default {
    execute
}