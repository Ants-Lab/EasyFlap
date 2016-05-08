# Protocol

**Frequency :** 433 Mhz

**Message size / Payload :** 8 MB

**FlapBox address:** 0

**Shutters addresses:** 1-255

### Flapbox → Shutter

| Shutter ID (1 Byte) | Command ID (1 Byte) | Data (6 Bytes) |     *Function*     |
| ------------------- | ------------------- | --------------- | ------------------ |
|          X          |          1          |  Angle (1 Byte) |*Rotate the shutter*|
|          ?          |          ?          |        ?        |        *?*         |

### Shutter → FlapBox

| Shutter ID (1 Byte) | Command ID (1 Byte) |          Data (6 Bytes)        |     *Function*     |
| ------------------- | ------------------- | ------------------------------ | ------------------ |
|          X          |          1          | Temp (1 B) Hum (1 B) Lum (1 B) |*Get captors' info* |
|          ?          |          ?          |               ?                |        *?*         |
