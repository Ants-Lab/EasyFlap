#include <FlapUtils.h>
#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include "Adafruit_TSL2591.h"
#include "DHT.h"

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

Adafruit_TSL2591 tsl = Adafruit_TSL2591(2591);

const int PAYLOAD = 24;
const int CHANNEL = 42;

const int MOTORLEFT = 5;
const int MOTORRIGHT = 9;

const int OPENTOCLOSE = 2000;
const int OPENTOMIDDLE = 500;
const int MIDDLETOCLOSE = 1500;

const int CLOSETOOPEN = 2000;
const int MIDDLETOOPEN = 500;
const int CLOSETOMIDDLE = 1500;

byte actualPosition = 0;

void configureMirf(){;
  Mirf.spi = &MirfHardwareSpi;  
  Mirf.init();
  Mirf.setRADDR((byte *)"sh001"); 
  Mirf.setTADDR((byte *)"flbox");  
  Mirf.payload = PAYLOAD;
  Mirf.channel = CHANNEL;   
  Mirf.config(); 
  Serial.println("Mirf configured successfully");
}

void configureSensors(){
  if (tsl.begin()){
    Serial.println("Found a TSL2591 sensor");
  }else{
    Serial.println("TSL2591 sensor not found");
    while (1);
  }
  tsl.setGain(TSL2591_GAIN_MED);
  tsl.setTiming(TSL2591_INTEGRATIONTIME_100MS);
  dht.begin();
  Serial.println("Sensors configured successfully");
}

void configureMotor(){
  pinMode(MOTORLEFT, OUTPUT);
  pinMode(MOTORRIGHT, OUTPUT);
  digitalWrite(MOTORLEFT, LOW);
  digitalWrite(MOTORRIGHT, LOW);
}

float getHumidity(){
  return dht.readHumidity();
}

float getTemperature(){
  return dht.readTemperature();
}

float getLight(){
  sensors_event_t event;
  tsl.getEvent(&event);
  if ((event.light == 0) | (event.light > 4294966000.0) | (event.light <-4294966000.0)){
    return 0;
  }else{
    return event.light;
  }
}

void setup(){
  Serial.begin(9600);
  
  Serial.println("EasyFlapShutter started, configuration started...");
  
  configureSensors();
  configureMirf();
  configureMotor();
  
  Serial.println("Configured successfully !"); 
}

void loop(){

  if(!Mirf.isSending() && Mirf.dataReady()){

    Serial.println("Message received...");
    
    byte data[PAYLOAD] = { 0 }; 
    
    Mirf.getData(data);

    byte wantedPosition;

    switch(data[0]){
      
      //Box ask for shutter rotation
      case 1:
        Serial.println("Position request");
        wantedPosition = data[1];
        if(actualPosition == 0){
          if(wantedPosition == 1){
            digitalWrite(MOTORRIGHT, LOW);
            digitalWrite(MOTORLEFT, HIGH);
            delay(CLOSETOMIDDLE);
            digitalWrite(MOTORLEFT, LOW);
          }else if(wantedPosition == 2){
            digitalWrite(MOTORRIGHT, LOW);
            digitalWrite(MOTORLEFT, HIGH);
            delay(CLOSETOOPEN);
            digitalWrite(MOTORLEFT, LOW);
          }
        }else if(actualPosition == 1){
          if(wantedPosition == 0){
            digitalWrite(MOTORRIGHT, HIGH);
            digitalWrite(MOTORLEFT, LOW);
            delay(MIDDLETOCLOSE);
            digitalWrite(MOTORRIGHT, LOW);
          }else if(wantedPosition == 2){
            digitalWrite(MOTORRIGHT, LOW);
            digitalWrite(MOTORLEFT, HIGH);
            delay(MIDDLETOOPEN);
            digitalWrite(MOTORLEFT, LOW);
          }
        }else if(actualPosition == 2){
          if(wantedPosition == 1){
            digitalWrite(MOTORRIGHT, HIGH);
            digitalWrite(MOTORLEFT, LOW);
            delay(OPENTOMIDDLE);
            digitalWrite(MOTORRIGHT, LOW);
          }else if(wantedPosition == 0){
            digitalWrite(MOTORRIGHT, HIGH);
            digitalWrite(MOTORLEFT, LOW);
            delay(OPENTOCLOSE);
            digitalWrite(MOTORRIGHT, LOW);
          }
        }
        break;
        
      //Box ask for information
      case 2:
        Serial.println("Information asked from a FlapBox.");
        byte buff[PAYLOAD] = { 0 };
        FUtils.writeByte(buff, 1, 0);
        FUtils.writeInt(buff, 1, 1);
        float temp, hum, li;
        temp = getTemperature();
        hum = getHumidity();
        li = getLight();
        FUtils.writeFloat(buff, temp, 5);
        FUtils.writeFloat(buff, hum, 9);
        FUtils.writeFloat(buff, li, 13);
        Mirf.send(buff);
        Serial.println("Information sent.");
        break;
    }    
  }
}

