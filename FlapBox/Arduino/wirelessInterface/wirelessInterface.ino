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
int PAYLOAD = 32; //Max 32 bytes
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
  if(Serial.available() > 0 && Serial.peek() == 1){
    Serial.read();
    byte data[Mirf.payload];
    Serial.readBytes(&data, sizeof(data));
    //TODO
  }

  if(!Mirf.isSending() && Mirf.dataReady()){
    byte data[Mirf.payload];
    Mirf.getData(data);
    Serial.write(0);
    Serial.write(data, sizeof(data));
  }
}
