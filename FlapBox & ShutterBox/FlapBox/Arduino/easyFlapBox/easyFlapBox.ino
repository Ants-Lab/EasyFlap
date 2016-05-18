#include <SPI.h>
#include <Mirf.h>
#include <nRF24L01.h>
#include <MirfHardwareSpiDriver.h>

void configureMirf() {
  Mirf.spi = &MirfHardwareSpi;
  Mirf.init();
  Mirf.setRADDR((byte *)"flbox");
  Mirf.setTADDR((byte *)"sh001");
  Mirf.payload = 32;
  Mirf.channel = 42;
  Mirf.config();
  Serial.println("Mirf configured successfully");
}

void writeFloat(byte* b, float f, int offset) {
  memcpy(b + offset, &f, 4);
}

void readFloat(byte* b, float* f, int offset) {
  memcpy(f + offset, b, 4);
}

void writeInt(byte* b, int i, int offset) {
  memcpy(b + offset, &i, 4);
}

void readInt(byte* b, int* i, int offset) {
  memcpy(i + offset, b, 4);
}

void writeByte(byte* b, byte bb, int offset) {
  memcpy(b + offset, &bb, 4);
}

void readByte(byte* b, byte* bb, int offset) {
  memcpy(bb + offset, b, 4);
}

void setup() {
  Serial.begin(9600);

  Serial.println("EasyFlapBox started, configuration started...");

  configureMirf();

  Serial.println("Configured successfully !");
}

void loop() {

  byte buff[32];
  writeByte(buff, 2, 0);
  Mirf.send(buff);

  Serial.println("Information request sent.");

  while (Mirf.isSending() || !Mirf.dataReady()) {
    delay(10);
  }

  byte response[32];

  Mirf.getData(response);

  switch (response[0]) {
    //Information received
    case 1:
      Serial.println("Information response received.");
      float temp, hum, li;
      readFloat(response, &temp, 5);
      readFloat(response, &hum, 9);
      readFloat(response, &li, 13);
      Serial.println("Temperature : " + String(temp));
      Serial.println("Humidity : " + String(hum));
      Serial.println("Light : " + String(li));
      break;
  }
  delay(10000);
}



