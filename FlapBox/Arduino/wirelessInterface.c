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

//Global variables
int CE_PIN = 8;
int CSN_PIN = 7;
int CHANNEL = 42; //0-127
int PAYLOAD = 32; //2.4Ghz module payload. Max 32 bytes
char ADDRESS[] = "flbox";

void setup() {
    Serial.begin(9600);
    
    //Init Mirf
    Mirf.cePin = CE_PIN;
    Mirf.csnPin = CSN_PIN;
    Mirf.spi = &MirfHardwareSpi;
    Mirf.init();
    
    //Config Mirf
    Mirf.channel = CHANNEL;
    Mirf.payload = PAYLOAD;
    Mirf.config();
    Mirf.setRADDR((byte *)ADDRESS);
}

void loop() {

    //Receive from rpi and send it to shutter
    if(Serial.available() > 0){
        if(Serial.peek() == 42){
            Serial.read(); //Useful ?
            
            //Read the shutter address on the USB serial
            byte shAddByte[5];
            Serial.readBytes(shAddByte, sizeof(shAddByte));
            
            //Convert the address to char array
            char shAddChar[5];
            for (int i=0; i < 5; i++){
              shAddChar[i] = (char)shAddByte[i];
            }
            //Set the shutter address
            Mirf.setTADDR((byte *)shAddChar);
            
            //Read the message on the USB serial
            byte data[Mirf.payload];
            Serial.readBytes(data, sizeof(data));
            
            //Send the message
            Mirf.send(&data);
            //Wait
            while(Mirf.isSending());
        }
    }
  
    //Receive from 2.4Ghz receiver and write on USB serial
    if(!Mirf.isSending() && Mirf.dataReady()){
        byte data[Mirf.payload];
        Mirf.getData(data);
        Serial.write(data, sizeof(data));
    }
}
