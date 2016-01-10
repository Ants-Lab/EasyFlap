/*
 * Author : Valentin FRITZ
 * Project : EasyFlap
 * File : wirelessInterface.ino
 * Description : Interface between NRF24 module and RPI
 * Date : January 4, 2016
 */

#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>

int CE_PIN = 8;
int CSN_PIN = 7;
int CHANNEL = 42; //0-127
int PAYLOAD = 32; //2.4Ghz module payload. Max 32 bytes
int SERIAL_PAYLOAD = 48; //Serial payload
char ADDRESS[] = "rpi01";

void setup() {
  Serial.begin(9600);

  Serial.println("Arduino setup starting...");

  Mirf.cePin = CE_PIN;
  Mirf.csnPin = CSN_PIN;
  Mirf.spi = &MirfHardwareSpi;
  Mirf.init();

  Mirf.channel = CHANNEL;
  Mirf.payload = PAYLOAD;
  Mirf.config();

  Mirf.setRADDR((byte *)ADDRESS);

}

void loop() {

  if(Serial.available() > 0){
    if(Serial.peek() == 1){
      Serial.read();
      byte data[Mirf.payload];
      Serial.readBytes(data, sizeof(data));
      //TODO
    }
  }

  //Receive from 2.4Ghz receiver and write on USB serial
  if(!Mirf.isSending() && Mirf.dataReady()){
    byte data[Mirf.payload];
    Mirf.getData(data);
    Serial.write(0);
    Serial.write(data, sizeof(data));
  }
}
