#include "FlapUtils.h"

FlapUtils FUtils = FlapUtils();

FlapUtils::FlapUtils(){}

void FlapUtils::writeFloat(byte* b, float f, int offset){ 
  memcpy(b + offset, &f, 4);
}

void FlapUtils::readFloat(byte* b, float* f, int offset){
  memcpy(f, b + offset, 4);
}

void FlapUtils::writeInt(byte* b, int i, int offset){
  memcpy(b + offset, &i, 4);
}

void FlapUtils::readInt(byte* b, int* i, int offset){
  memcpy(i, b + offset, 4);
}

void FlapUtils::writeByte(byte* b, byte bb, int offset){
  memcpy(b + offset, &bb, 4);
}

void FlapUtils::readByte(byte* b, byte* bb, int offset){
  memcpy(bb, b + offset, 4);
}

String FlapUtils::idToAddress(int id){
  if(id >= 0 && id <= 9){
    return "sh00" + String(id);
  }else if(id >= 10 && id <= 99){
    return "sh0" + String(id);
  }else if(id >= 100 && id <= 999){
    return "sh" + String(id);
  }
  return "error";
}
