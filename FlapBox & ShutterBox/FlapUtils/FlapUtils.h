#ifndef _FLAPUTILS_H_
#define _FLAPUTILS_H_

#include <Arduino.h>

class FlapUtils {
	public:
		FlapUtils();
		
		void writeFloat(byte* b, float f, int offset);
		void readFloat(byte* b, float* f, int offset);
		void writeInt(byte* b, int i, int offset);
		void readInt(byte* b, int* i, int offset);
		void writeByte(byte* b, byte bb, int offset);
		void readByte(byte* b, byte* bb, int offset);
		String idToAddress(int id);
};

extern FlapUtils FUtils;

#endif
