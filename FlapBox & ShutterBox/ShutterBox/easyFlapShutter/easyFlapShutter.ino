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

void configureMirf(){
  Mirf.spi = &MirfHardwareSpi;  
  Mirf.init();
  Mirf.setRADDR((byte *)"sh001"); 
  Mirf.setTADDR((byte *)"flbox");  
  Mirf.payload = 32;
  Mirf.channel = 42;   
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

void writeFloat(byte* b, float f, int offset){ 
  memcpy(b + offset, &f, 4);
}

void readFloat(byte* b, float* f, int offset){
  memcpy(f + offset, b, 4);
}

void writeInt(byte* b, int i, int offset){
  memcpy(b + offset, &i, 4);
}

void readInt(byte* b, int* i, int offset){
  memcpy(i + offset, b, 4);
}

void writeByte(byte* b, byte bb, int offset){
  memcpy(b + offset, &bb, 4);
}

void readByte(byte* b, byte* bb, int offset){
  memcpy(bb + offset, b, 4);
}

void setup(){
  Serial.begin(9600);
  
  Serial.println("EasyFlapShutter started, configuration started...");
  
  configureSensors();
  configureMirf();
  
  Serial.println("Configured successfully !"); 
}

void loop(){

  if(!Mirf.isSending() && Mirf.dataReady()){

    Serial.println("Message received...");
    
    byte data[32]; 
    
    Mirf.getData(data);

    switch(data[0]){
      //Box ask for shutter rotation
      case 1:
        
        break;
      //Box ask for information
      case 2:
        Serial.println("Information asked from a shutter.");
        byte buff[24] = { 0 };
        writeByte(buff, 1, 0);
        writeInt(buff, 1, 1);
        float temp, hum, li;
        temp = getTemperature();
        hum = getHumidity();
        li = getLight();
        writeFloat(buff, temp, 5);
        writeFloat(buff, hum, 9);
        writeFloat(buff, li, 13);
        Mirf.send(buff);
        Serial.println("Information sent.");
        break;
    }    
  }
}

