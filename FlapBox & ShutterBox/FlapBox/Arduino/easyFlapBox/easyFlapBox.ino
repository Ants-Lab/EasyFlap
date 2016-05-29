#include <FlapUtils.h>
#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>

const int PAYLOAD = 24;
const int CHANNEL = 42;

void configureMirf() {
  Mirf.spi = &MirfHardwareSpi;
  Mirf.init();
  Mirf.setRADDR((byte *)"flbox");
  Mirf.setTADDR((byte *)"sh001");
  Mirf.payload = PAYLOAD;
  Mirf.channel = CHANNEL;
  Mirf.config();
  //Serial.println("Mirf configured successfully");
}

void setup() {
  Serial.begin(9600);

  //Serial.println("EasyFlapBox started, configuration started...");

  configureMirf();

  //Serial.println("Configured successfully !");
}

void loop() {

  if(Serial.available() > 0){
    
    String message = Serial.readString();

    if(message.charAt(0) == '1'){
      byte pos = message.charAt(1);
      byte buf[PAYLOAD] = { 0 };
      buf[0] = 1;
      buf[1] = pos;
      Mirf.send(buf);
    }else if(message.charAt(0) == '2'){
      
      byte buf[PAYLOAD] = { 0 };
      buf[0] = 2;
      Mirf.send(buf);
    }
  }

  if(!Mirf.isSending() && Mirf.dataReady()){
    byte data[PAYLOAD] = { 0 };

    Mirf.getData(data);

    switch (data[0]) {
      //Information received
      case 1:
        //Serial.println("Information response received.");
        int id;
        FUtils.readInt(data, &id, 1);
        float temp, hum, li;
        FUtils.readFloat(data, &temp, 5);
        FUtils.readFloat(data, &hum, 9);
        FUtils.readFloat(data, &li, 13);
        Serial.println("1;" + String(id) + ";" + String(temp) + ";" + String(hum) + ";" + String(li)); 
        delay(1000);
        //Serial.println("Temperature : " + String(temp));
        //Serial.println("Humidity : " + String(hum));
        //Serial.println("Light : " + String(li));
        break;
    }
  }

  
}



