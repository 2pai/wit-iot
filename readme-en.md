<!-- # Smart assistant with wit.ai for IoT -->

# Build Smart Assistant with Wit.ai to Manage IoT Device

## Introduction

As we know, now there's a lot of personal virtual assistant apps, like Siri, Alexa, Google Assistant, etc that can help us to do many things. We can give commands using voice ot text and the assistant will give the feedback with informations or actions.

### What is NLP?

NLP stands for _Natural Language Processing_, which is one of the subsets in Artificial Intelligence concerned with the interactions between computers and human language, in particular how to program computers to process and analyze large amounts of natural language data.

### Goals

Today, we gonna build a virtual personal assistant that can control our IoT device to watering the plants in the front garden. We will combine a few technologies such as NLP, IoT, SpeechAPI, etc.

## Table of Contents

- [Build Smart Assistant with Wit.ai to Manage IoT Device](#build-smart-assistant-with-witai-to-manage-iot-device)
  - [Introduction](#introduction)
    - [What is NLP?](#what-is-nlp)
    - [Goals](#goals)
  - [Table of Contents](#table-of-contents)
  - [Building Application](#building-application)
      - [How will it work?](#how-will-it-work)
        - [Here is that flow in action](#here-is-that-flow-in-action)
        - [The application logic will flow like this](#the-application-logic-will-flow-like-this)
      - [Prerequisites](#prerequisites)
        - [Hardware](#hardware)
        - [Software](#software)
  - [Preparing Environment for Developing Application](#preparing-environment-for-developing-application)
    - [Provisioning MQTT Broker & MongoDB](#provisioning-mqtt-broker--mongodb)
    - [Provisioning Configuration Files](#provisioning-configuration-files)
  - [Train Wit Application for Natural Language Processing (NLP)](#train-wit-application-for-natural-language-processing-nlp)
      - [Create Wit Application](#create-wit-application)
      - [Train Wit Application With Utterance](#train-wit-application-with-utterance)
        - [Turn On Device](#turn-on-device)
        - [Turn Off Device](#turn-off-device)
        - [Get Device Data](#get-device-data)
      - [Create Connector Wit](#create-connector-wit)
        - [Update Configuration File](#update-configuration-file)
  - [Create API Gateway](#create-api-gateway)
    - [Create MongoDB Connector](#create-mongodb-connector)
    - [Create MQTT Connector](#create-mqtt-connector)
    - [Create Controller](#create-controller)
    - [Create REST API for API Gateway](#create-rest-api-for-api-gateway)
  - [Create Dashboard (Frontend)](#create-dashboard-frontend)
      - [Configure Frontend](#configure-frontend)
  - [Manage IoT Device](#manage-iot-device)
    - [Installing Library](#installing-library)
    - [IoT Device wiring schema](#iot-device-wiring-schema)
      - [Compile The Program](#compile-the-program)
        - [Configuring IoT Device](#configuring-iot-device)
  - [Run The Application](#run-the-application)
    - [The Architecture](#the-architecture)
    - [Run The Application, MongoDB and MQTT Broker](#run-the-application-mongodb-and-mqtt-broker)
  - [Summary](#summary)
    - [What's Next?](#whats-next)
    - [Reference](#reference)

## Building Application

Before we start building the app, I will describe how the app work and prerequisite to follow. Then, I will describe the detail of all the steps before it's ready to be run in production mode.

#### How will it work?

Starting from a high-level, this application will work like this:

1. Open browser > go to the address of **Dashboard**.
2. Click `Listen` Button > Give voice command after `Log` displayed message `Recognition Started`
3. If `Log` displayed the message `Recognition ended` then the command will be forwarded to the server.
4. The server will do the command from the user and display the data (if requested) to the Dashboard.

##### Here is that flow in action

![alt text](./assets/gif/demo-app-en.gif 'Demo Application')

The way this application works is quite simple, but in this tutorial, we're using so much technology to achieve the goals. This is used so that the application that we create this time can be easily to be scaled with broader goals.

I will explain the application in 5 sections

- Infrastructure (MQTT Broker & Database)
- API Gateway (_Backend_)
- Dashboard (_Frontend_)
- NLP System (Wit.ai)
- IoT Device (Mikrokontroller)

To give clear details about how this app work in the background
##### The application logic will flow like this

![alt text](./assets/img/how-it-works.png 'How it Works')

#### Prerequisites

In order to run all section on the application, we need a few things to prepare

##### Hardware

- 1x NodeMCU ESP8266
- 1x DHT22 Sensors
- 1x Relay Module

##### Software

- Browsers who support API `SpeechRecognition`
- Docker & Docker-Compose
- NodeJS, NPM & Typescript
- Arduino IDE

## Preparing Environment for Developing Application

The first thing we have to do is preparing the environment for developing our application. We will use [typescript](https://www.typescriptlang.org/) and [npm](https://www.npmjs.com) to developing our app. Make sure Typescript was installed, if not run command `npm install -g typescript` to install typescript.

Configure the typescript compiler by create a file `tsconfig.json` :
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Configure the npm with create a file called `package.json` :

```json
// package.json
{
  "name": "iot-witai",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node ./dist/backend/app.js",
    "dev": "nodemon ./src/backend/app.ts",
    "build": "tsc -p ."
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/express": "^4.17.8",
    "@types/node": "^14.6.4",
    "nodemon": "^2.0.4",
    "ts-node": "^9.0.0"
  },
  "dependencies": {
    "@types/body-parser": "^1.19.0",
    "@types/mongoose": "^5.7.36",
    "@types/mqtt": "^2.5.0",
    "@types/node-wit": "^4.2.2",
    "body-parser": "^1.19.0",
    "cors": "^2.8.5",
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "mongoose": "^5.10.7",
    "mqtt": "^4.2.1",
    "node-wit": "^6.0.0",
    "path": "^0.12.7"
  }
}
```
Then run `npm install` to install packages that needed for our app

### Provisioning MQTT Broker & MongoDB

We will use MQTT Broker(Mosquitto) & Database(MongoDB). Instead of installing on our host machine, we will use Docker to run the services that we need. With Docker-compose, we can easily provisioning our multi-container application in our host.

Create `docker-compose.yml` at the root folder of the application.
```yaml
# Docker-compose.yml
version: '3.7'
services:
  mosquitto:
    image: eclipse-mosquitto:1.6.7
    hostname: mosquitto
    container_name: mosquitto
    ports:
      - 1883:1883
      - 9001:9001
    volumes:
      - ./conf/mosquitto.conf:/mosquitto/config/mosquitto.conf
  mongodb:
    image: mongo:latest
    hostname: mongo
    container_name: mongo-iot
    ports:
      - 27017:27017
```

To enable Websocket Protocol in MQTT Broker, we can add the configuration file to create a file called `mosquitto.conf` in `./conf/` and set the Websocket Protocol to be run on port 9001.

```

# this will listen for mqtt on tcp
listener 1883

# this will expect websockets connections
listener 9001
protocol websockets

```

### Provisioning Configuration Files

To store the Configuration, we will use `.env` file. 

Create this file on root folder :

```
# .env
PORT=3000
MQTT_URI=mqtt://localhost
MONGO_URI=mongodb://localhost:27017/jarwin
WIT_TOKEN= #Your wit token

```

To make the `.env` file can be loaded from our application, we will create a controller to load the `.env` file to our application. 

Create `config.ts` in `./src/backend/`

```typescript
// config.ts
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  mongoURI: process.env.MONGO_URI ?? '',
  mqttURI: process.env.MQTT_URI ?? '',
  witToken: process.env.WIT_TOKEN ?? '',
  port: process.env.PORT ?? 3000,
};
```

After those steps are done, we can start to develop our application.

## Train Wit Application for Natural Language Processing (NLP)

In this tutorial, we will use [wit.ai](https://wit.ai/) as an NLP System. With this, we can build our personal assistant as natural as possible and we didn't have to do a lot of Machine Learning coding like using PyTorch, Tensorflow, etc to train our application.

In this section, we will try to train our Wit App to identify several commands like `set_device` and `get_device` in our IoT device.

#### Create Wit Application

1. Open [wit.ai](https://wit.ai/) and Log In with your Facebook account.
2. Add New Wit App
3. Enter your Name Application, language, and visibility.
4. Click `Create`

#### Train Wit Application With Utterance
We will use Pompa as our device name, pompa means pump in Indonesia.

##### Turn On Device

1. Select `understanding` on Menu
2. Insert `Turn on pompa` in Utterance Form
3. Add Intent and Insert  `set_device` as an Intent then click `Create Intent`
4. Select word `pompa` and Insert `device` in Entity Form then click `Create Entity`
5. Click `Add Trait` and choose `wit/on_off` then set into `on`
6. Click `Train and validate`

##### Turn Off Device

1. Insert `Turn off pompa` in Utterance Form
2. Set Intent to `set_device`, Entity to `pompa`, and Traits to `wit/on_off` = `off`
3. Click `Train and validate`

##### Get Device Data

1. Insert `Get data pompa` in the Utterance Form
2. Add new intent called `get_device` and click `Create Intent`
3. Make sure the Trait field empty
4. Click `Train and validate`


![alt text](./assets/gif/train-app-en.gif 'Train Wit App')

We can train our Wit App with other utterances. It can make the model of our Wit application more precise, natural, and can detect other words. For example :

- Get Pompa Statistics
- Pompa On
- Pompa Off
- etc

Iterate the process and make sure the output matches what you expected.

#### Create Connector Wit 

Wit.ai using a REST to communicate. Instead, we will use a library called `node-wit` to create a connector for our API Gateway, it will make the code less.

Create a file called `wit.ts` in `./src/backend/`

```typescript
// wit.ts
import { Wit } from 'node-wit';
import config from './config';

const client = new Wit({
  accessToken: config.witToken,
});

const get = async (message: string) => {
  try {
    const data = await client.message(message, {});
    return data;
  } catch (error) {
    return error;
  }
};

export default {
  get,
};
```
In this file, we have a function `get(message)` that is used to query messages into our Wit App. This function takes the message as a query then it will return 4 fields such as Text, Intent, Trait, Entity. All of the fields have a `confidence` to shows the percentage accuracy of predictions.

##### Update Configuration File

To get Wit.ai token for our app, we can open **MyApps** > **[Nama aplikasi Wit]** > **Management** > **Setting** > **Server Access Token**.

```
# .env
WIT_TOKEN= <Your wit token>
```

## Create API Gateway

API Gateway will be used to be a middleware for Dashboard, Wit.ai, MQTT, and MongoDB. We will use REST as an interface, and will be consumed by the Dashboard (Frontend)

### Create MongoDB Connector

In this section we will create a MongoDB connector in our API Gateway, MongoDB will be used to store history statistics data from our IoT device. We will create file `mongo.ts` in `./src/backend`

```typescript
// mongo.ts
import mongoose from 'mongoose';
import config from './config';

const { Schema, model, connect } = mongoose;

const init = () => {
  connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
};

const sensorSchema = new Schema({
  deviceName: String,
  payload: Object,
  date: { type: Date, default: Date.now },
});

const sensorModel = model('sensor', sensorSchema);

export default {
  init,
  sensorModel,
};
```
This connector also includes a schema of the data and `Init()` function is used to initializing connection to MongoDB when the app is started. 

### Create MQTT Connector

To communicate with the IoT devices via API Gateway, we will use the MQTT Protocol(TCP). The main reason why we use the MQTT Protocol is to make our application can handle requests in asynchronous mode and didn't block the other processes. For other reasons, MQTT is the protocol that is commonly used to communicate with IoT devices.

To create a connector, we create file `mqtt.ts` in `./src/backend/`

```typescript
// mqtt.ts
import Mqtt from 'mqtt';
import mongo from './mongo';
import config from './config';

const client = Mqtt.connect(config.mqttURI, {
  queueQoSZero: false,
});

const pub = (topic: string, message: any) => {
  client.publish(topic, message, { qos: 2 });
};

const sub = (topic: string) => {
  client.subscribe(topic, { qos: 2 });
};

client.on('message', (topic, message) => {
  if (topic == 'pompa-report') {
    const payload = JSON.parse(message.toString());

    if (payload.kind == 'pompa-stats') {
      const sensor = new mongo.sensorModel({
        deviceName: payload['deviceName'],
        payload: {
          hum: payload['humidity'],
          temp: payload['temperature'],
        },
      });

      pub(
        'web',
        JSON.stringify({
          humidity: payload.humidity,
          temp: payload.temperature,
          date: Date.now(),
        })
      );

      sensor.save();
    }
  }
});

export default {
  pub,
  sub,
};
```

In this code, we wrap function `publish` and `subscribe` in the `mqtt.client`, it will enable us to reuse the function in another module.

We handle the incoming message from the IoT device, incoming report message with kind `pompa-stats` will be inserted to MongoDB. Then, the payload which includes data from statistics of IoT Device will be forwarded to the Dashboard (Frontend) using MQTT with topic `web`

### Create Controller

The Controller is responsible to decide if the result of prediction from our Wit Application can be used or not. We set the threshold score of `confidence` to `0.90` to make sure the result is precision and similar to what we expected, if the score is below `0.90` the result can be used.

Create `controller.ts` in `./src/backend/`

```typescript
// controller.ts
import Mqtt from './mqtt';

const execute = (payload: any) => {
  const { intents, entities, traits } = payload;

  const intent = intents
    .filter((i: any) => i.confidence > 0.9)
    .map((i: any) => i.name);

  const entity = entities['device:device']
    .filter((device: any) => device.confidence > 0.9)
    .map((d: any) => d.value);

  if (intent[0] == 'set_device') {
    const trait = traits['wit$on_off']
      .filter((t: any) => t.confidence > 0.9)
      .map((obj: any) => obj.value);

    const status = trait[0] == 'on' ? '1' : '0';
    Mqtt.pub(entity[0], status);
  } else if (intent[0] == 'get_device') {
    Mqtt.pub('pompa-stats', '1');
  } else {
    console.log('not found');
  }
};

export default {
  execute,
};
```

Function `execute` will check The Intent from payload. If The Intent is `set_device` then a message will be published through MQTT with the device name (from Entity) as a topic which includes Traits (On/OFF) as a payload. If The Intent is `get_device` then a message will be published through MQTT with `pompa-stats` as a topic and include `1` as payload to trigger the sensor on IoT Device.

This function will be exported and called from the entrypoint of API Gateway.
### Create REST API for API Gateway

We will use REST as an API. But, not only for backend services, we will use this to serve the Dashboard (Frontend) too.

Create `app.ts` in `./src/backend/`
```typescript
//app.ts
import express, { NextFunction } from 'express';
import wit from './wit';
import mqtt from './mqtt';
import controller from './controller';
import mongo from './mongo';
import bp from 'body-parser';
import path from 'path';
import config from './config';

const app = express();
const cors = require('cors');

app.use(cors());
app.use(bp.json());
app.get('/', async (req, res) => {
  res.send('This app is running properly');
});
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});
app.post('/send', async (req, res) => {
  const { message } = req.body;
  const payload = await wit.get(message);
  console.log(payload);
  controller.execute(payload);

  res.send('ok');
});

app.get('/sensor-data', async (req, res) => {
  try {
    const data = await mongo.sensorModel.find({}).limit(5).sort({ date: -1 });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ msg: 'Error' });
  }
});
app.listen(config.port, () => {
  mongo.init();
  mqtt.sub('pompa-report');
  console.log(`This app runs on ${config.port}`);
});
```

We have will have 4 Endpoint

1. `GET /`
    This endpoint will be used to check the status of our REST API Server, which is running successfully and can be accessed.
2. `GET /dashboard`
   This endpoint will be used to serve the static file from the frontend app(Dashboard), it will serve file `frontend/index.html`
3. `POST /send`
   This endpoint is used to receive a text payload from the frontend, the payload will be used as a parameter to request Wit Application and make a prediction. The result will be passed to `execute` function on the controller to determine what action to take.
4. `GET /sensor-data`
  This endpoint will be used to display the 5 last data from sensor on IoT Device. It will be used to be an init data in our frontend application.

This REST API will be running on the PORT that we specify on `.env` file.

## Create Dashboard (Frontend)

To make the application more easily, we need a Dashboard (Frontend) application. This application will be an interface of our app, The request will be passed to our backend application. We will use Websocket & TCP as protocols to communicate with the backend server. 

Our frontend app was very simple, we only use single file `index.html`, for Styling we use Bootstrap 4 as a CSS library and `paho-mqtt` library to receive message from MQTT (Websocket)

Create `index.html` in `./src/frontend/`
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content="Aurelio De Rosa" />
    <title>Dashboard</title>
    <link
      rel="stylesheet"
      href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css"
      integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
      crossorigin="anonymous"
    />
    <style>
      .recognition-options {
        list-style: none;
        padding: 0;
      }

      .recognition-options li {
        display: inline;
      }

      fieldset {
        border: 0;
        margin: 0.5em 0;
        padding: 0;
      }

      legend {
        padding: 0;
      }
      .fade-in {
        opacity: 1;
        animation-name: fadeInOpacity;
        animation-iteration-count: 1;
        animation-timing-function: ease-in;
        animation-duration: 1s;
      }

      @keyframes fadeInOpacity {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="jumbotron">
        <h1 class="text-center">✨ Jarwis</h1>
        <p>
          <small>
            Who need a Jarvis If we can build a jarwis *jk <br />
            Build With ❤️ &nbsp; By Iqbal Syamil
          </small>
        </p>
        <p hidden class="js-api-support">API not supported</p>

        <div class="js-api-info">
          <div class="form-group">
            <textarea
              class="form-control"
              placeholder="Transcription"
              style="resize: none"
              aria-label="Transcription"
              id="transcription"
              class="log"
              readonly
            ></textarea>
          </div>

          <form action="" method="get">
            <button type="button" id="button-play" class="button">
              Listen
            </button>
          </form>

          <h2>Log</h2>
          <div id="log" class="log"></div>
        </div>
      </div>
      <div>
        <table id="sensor-table" class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Humidity</th>
              <th>Temperature</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js"
      type="text/javascript"
    ></script>
    <script>
      const apiHost = 'http://localhost:3000'; // host your api gateway i.e http://localhost:3000
      var mqtt;
      const mqttHost = 'localhost'; // your mqtt host i.e. localhost
      const mqttPort = 9001; // port mqqt (websocket) default = 9001
      const dateLang = 'id-ID'; // dateLocale Format
      const speechRecognitionLang = 'ID'; // language used in speechRecognition i.e "EN"
      function mqttConnect() {
        mqtt = new Paho.MQTT.Client(mqttHost, Number(mqttPort), 'client-web');
        mqtt.connect({ onSuccess: onConnect });
        mqtt.onConnectionLost = onConnectionLost;
        mqtt.onMessageArrived = onMessageArrived;
      }

      function onConnect() {
        // Once a connection has been made, make a subscription and send a message.
        mqtt.subscribe('web');
      }
      function onMessageArrived(message) {
        const payload = JSON.parse(message.payloadString);
        var tablerow = tableref.insertRow(0);
        tablerow.className = 'fade-in';
        tablerow.innerHTML = `<tr class=fade-in> <td>${new Date(
          payload.date
        ).toLocaleString(dateLang)}</td> <td>${payload.humidity}</td> <td>${
          payload.temp
        }</td> </tr>`;
      }
      function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
        }
      }

      function send(msg) {
        const raw = JSON.stringify({ message: msg });
        fetch(apiHost + '/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: raw,
          redirect: 'follow',
        })
          .then((response) => response.text())
          .then((result) => console.log(result))
          .catch((error) => console.log('error', error));
      }
      function logEvent(string) {
        var log = document.getElementById('log');

        log.innerHTML = string + '<br />' + log.innerHTML;
      }

      window.SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition || null;

      if (!SpeechRecognition) {
        document.querySelector('.js-api-support').removeAttribute('hidden');
        document.querySelector('.js-api-info').setAttribute('hidden', '');
        [].forEach.call(document.querySelectorAll('form button'), function (
          button
        ) {
          button.setAttribute('disabled', '');
        });
      } else {
        var recognizer = new SpeechRecognition();
        var transcription = document.getElementById('transcription');

        // Start recognising
        recognizer.addEventListener('result', function (event) {
          transcription.textContent = '';

          for (var i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              send(event.results[i][0].transcript);
              transcription.textContent =
                event.results[i][0].transcript +
                ' (Confidence: ' +
                event.results[i][0].confidence +
                ')';
            } else {
              transcription.textContent += event.results[i][0].transcript;
            }
          }
        });

        // Listen for errors
        recognizer.addEventListener('error', function (event) {
          logEvent('Recognition error: ' + event.message);
        });

        recognizer.addEventListener('end', function () {
          logEvent('Recognition ended');
        });

        document
          .getElementById('button-play')
          .addEventListener('click', function () {
            document.getElementById('log').textContent = '';

            transcription.textContent = '';

            recognizer.lang = speechRecognitionLang;
            recognizer.continuous = !true;
            recognizer.interimResults = true;

            try {
              recognizer.start();
              logEvent('Recognition started');
            } catch (ex) {
              logEvent('Recognition error: ' + ex.message);
            }
          });
        var tableref = document
          .getElementById('sensor-table')
          .getElementsByTagName('tbody')[0];
        document.addEventListener('DOMContentLoaded', function (event) {
          fetch(apiHost + '/sensor-data')
            .then((response) => response.json())
            .then((result) => {
              result.forEach((res) => {
                tableref.insertRow(
                  tableref.rows.length
                ).innerHTML = `<tr> <td>${new Date(res.date).toLocaleString(
                  'id-ID'
                )}</td> <td>${res.payload.hum}</td> <td>${
                  res.payload.temp
                }</td> </tr>`;
              });
            });

          mqttConnect();
        });
      }
    </script>
  </body>
</html>
```

#### Configure Frontend 

There are several things to take attention to, we have to make sure the configuration in our application is correct. We have to define several things, like the address of API Gateway, address of MQTT, port of MQTT(Websocket), date format, and language format that are used in Speech Recognition API.

```js
         /* ... Truncated code  */
      <script>
         const apiHost = "http://localhost:3000"; // host your api gateway i.e http://localhost:3000
         var mqtt;
         const mqttHost = "localhost"; // your mqtt host i.e. localhost
         const mqttPort = 9001; // port mqqt (websocket) default = 9001
         const dateLang = "id-ID" // dateLocale Format
         const speechRecognitionLang = "ID" // language used in speechRecognition i.e "EN"
         /* ... Truncated code  */

```

## Manage IoT Device

As in the introduction section, the goal of our IoT device is watering the plants by using a pump. So, we will make sure that our IoT Device can do 3 things :

1. Turn on the pump
2. Turn off the pump
3. Get statistics data from the sensor

### Installing Library

We will have 4 external libraries. Please make sure that you have already installed those libraries in the Arduino IDE.

1. [PubSubClient.h](https://github.com/knolleary/pubsubclient)
2. [ArduinoJson.h](https://github.com/ekstrand/ESP8266wifi)
3. [DHTesp.h](https://github.com/beegee-tokyo/DHTesp)
4. [ESP8266WiFi.h](https://github.com/ekstrand/ESP8266wifi)

### IoT Device wiring schema

Please make sure the wiring pin is correct like as the schema below.

![alt text](./assets/img/skema.png 'Gambaran Skema Perangkat IoT')
Notes :

- Blue Line = wiring path for digital/analog
- Green Line = Wiring path for positive voltage current
- Red Line = Wiring path for negative voltage-current (Ground/GND)

#### Compile The Program

Use the code below to compile your IoT Device (NodeMCU ESP8266).

```c++
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
```

How The Program works 

1. The Device will connect to WiFI that have already defined.
2. After getting connected, the device will connect to the MQTT Broker, subscribe `pompa` / device name topic, and publish a message to the topic `report` to tell that the device is ready to use.
3. The Device will wait until get messages from API Gateway.
4. If there's a message coming from topic `pompa` / device name topic, then The device will execute the command where's to Turn on/off the pump based on data payload. After the command was executed, a status will be sent to `pompa-report` as feedback encoded in JSON.
5. If there's a message coming from topic `pompa-stats` then the device will get data from the DHT Sensor (Temperature & Humidity) and the result will be sent to `pompa-report` topic encoded in JSON.

##### Configuring IoT Device

Define several variable configurations in `arduino/pompa.ino` which is included `ssid`, `password`, `broker`.

```c++
// ... Truncated code 

WiFiClient espClient;
PubSubClient mqtt(espClient);
const char* ssid     = "";     //  SSID (name) dari Wi-Fi
const char* password = "";     //  Password Wi-Fi
const char* broker = "";     // ip / domain dari mqtt broker. contoh (192.168.1.2)
const char* deviceName = "pompa";      // nama perangkat
StaticJsonDocument<250> wrapper;
DHTesp dht;

// ... Truncated code 

```

Then, the code is ready to be compiled to your IoT Device.

## Run The Application

### The Architecture

After we have done with all the steps above, here is a complete overview of the architecture used in this project.

![alt text](./assets/img/wit-ai-iot-arch.png 'The Architecture')

### Run The Application, MongoDB and MQTT Broker

After the configuration is complete, to run the app, run the commands below in order.

1. `docker-compose up` (Run MQTT Broker & MongoDB)
2. `npm run dev` (Run the app in Dev Mode)
3. Connect IoT devices with power.
4. Open the Dashboard application at http://localhost:3000/dashboard

## Summary

Congratulations, we have already build a project to control our IoT Device with wit.ai & NLP. In this article, we learn so many things like how we train our NLP app with Wit.ai, how to communicate to IoT Device, etc. Hopefully what we have been learned today can be useful and even can be developed into even cooler things! 😁

The entire code of this project can be accessed [here](https://github.com/2pai/wit-iot/)

### What's Next?

This application isn't perfect. If you folks interested in developing this application, here are some list of idea:

- Manage Mulitple IoT Device (Add, Delete, and Update)
- Visualize Active/Not Active of IoT Device 
- Build the mobile version
- Etc

### Reference

- https://medium.com/wit-ai/build-an-interactive-voice-enabled-android-app-with-wit-ai-6f6d72cf94be
- https://github.com/AurelioDeRosa/HTML5-API-demos/blob/master/demos/web-speech-api-demo.html
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- https://developers.facebook.com/blog/post/2020/06/03/build-smart-bookmarking-tool-rust-rocket/