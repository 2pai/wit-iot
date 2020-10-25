# WIT IOT
---
This Repository include proof of concept to build virtual personal assistant that can control our IoT device to watering the plants in the front garden. This project will combine a few technologies such as NLP, IoT, SpeechAPI, etc.
This Repostiory have Documentation in [Bahasa](readme-id.md) and [English](readme-en.md)

#### Prerequisites

In order to run all section on the application, we need a few things to prepare

##### Hardware

- NodeMCU ESP8266
- DHT22 Sensors
- Relay Module

##### Software

- Browsers who support API `SpeechRecognition`
- Docker & Docker-Compose
- NodeJS, NPM & Typescript
- Arduino IDE

### How To Run 
#### Clone this repository
```
git clone https://github.com/2pai/wit-iot
```
#### Install Dependencies
```
npm install
```
#### Run MongoDB & MQTT Broker
```
docker-compose up
```
#### Set .env file 
```
cp .env.example .env
```
#### Compile the IoT Device Program
Use the source code on `arduino/pompa.ino` then compile it.
Please make sure the configuration is correct.

#### Set configuration in frontend
Open `src/frontend.html` then set the configuration.

#### Run The Application
```
npm run dev
```
#####
Now, you can access at `http://localhost:3000/dashboard`
