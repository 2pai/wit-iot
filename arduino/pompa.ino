#define SerialMon Serial

#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>        // Include the Wi-Fi library
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "DHTesp.h"

//Create software serial object to communicate with SIM800L
WiFiClient espClient;
PubSubClient mqtt(espClient);
const char* ssid     = "";     // The SSID (name) of the Wi-Fi network you want to connect to
const char* password = "";     // The password of the Wi-Fi network
const char* broker = "";     // ip / domain your mqtt broker example (192.168.1.2)
const char* deviceName = "pompa";      // name of your device
StaticJsonDocument<250> wrapper;
DHTesp dht;


boolean res;
boolean mqttConnect() {
  char buffer[256];
  SerialMon.print("Connecting to ");
  SerialMon.print(broker);
  wrapper["deviceName"] = deviceName;

  // Connect to MQTT Broker
  boolean status = mqtt.connect(deviceName);

  if (status == false) {
    SerialMon.println("fail");
    return false;
  }
  SerialMon.println("success");
  mqtt.subscribe("pompa");
  mqtt.subscribe("pompa-stats");
  wrapper["kind"] = "connected";
  wrapper["status"] = true;
  size_t n = serializeJson(wrapper,buffer);
  mqtt.publish("report",buffer,n);
  return mqtt.connected();
}
void callback(char* topic, byte* payload, unsigned int length);



void setup()
{
  ESP.eraseConfig();
  SerialMon.begin(9600);
  WiFi.begin(ssid, password);
  dht.setup(D2, DHTesp::DHT22); // Connect DHT sensor to GPIO 17
  Serial.print("Connecting to ");
  pinMode(D1, OUTPUT); // initialize pin as OUTPUT
  Serial.println(ssid);
  while (WiFi.status() != WL_CONNECTED) { // Wait for the Wi-Fi to connect
        delay(1000);
        Serial.print('*');
  }


  mqtt.setServer(broker, 1883); // connect to mqtt broker with port (default : 1883)
  mqtt.setCallback(callback);

}

void loop()
{
  
  if (!mqtt.connected()) {
      SerialMon.println("Trying Connecting to mqtt broker");
    if(mqttConnect()){
      SerialMon.println("MQTT Connected");
    }
  }

  mqtt.loop();

}

void callback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<200> doc;
  char buffer[256];
  doc["deviceName"] = deviceName;
  doc["kind"] = topic;

  if(strcmp(topic, "pompa") == 0){
    if(payload[0] == '1'){
      digitalWrite(D1,1);
      doc["status"] = true;
      SerialMon.println("Pompa Nyala");
    }
    if(payload[0] == '0'){
      digitalWrite(D1,0);
      doc["status"] = false;
      SerialMon.println("Pompa Mati");
    }
      size_t n = serializeJson(doc,buffer);
      mqtt.publish("pompa-report",buffer,n);

  }else if(strcmp(topic, "pompa-stats") == 0){
    if(payload[0] == '1'){
      float humidity = dht.getHumidity();
      float temperature = dht.getTemperature();
      
      doc["humidity"] = humidity;
      doc["temperature"] = temperature;
      
      size_t n = serializeJson(doc,buffer);
      mqtt.publish("pompa-report",buffer,n);
    }
  }
  doc.clear();
}