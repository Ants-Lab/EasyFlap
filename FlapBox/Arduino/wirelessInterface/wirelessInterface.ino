/*
 * Author : Valentin FRITZ
 * Project : EasyFlap
 * File : wirelessInterface.ino
 * Description : Interface between NRF24 module and RPI
 * Date : January 4, 2016
 */

#include <SPI.h>
#include <RH_NRF24.h>

RH_NRF24 nrf24;

void setup() {
  Serial.begin(9600);

  Serial.println("Arduino setup starting...");

  if(!nrf24.init())
    Serial.println("init failed.");

  if(!nrf24.setChannel(1))
    Serial.println("setChannel failed.");

  if(!nrf24.setRF(RH_NRF24::DataRate2Mbps, RH_NRF24::TransmitPower0dBm))
    Serial.println("setRF failed.")
}

void loop() {

}
