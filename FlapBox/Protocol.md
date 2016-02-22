# Protocol

**Channel :** 42

**Message size / Payload :** 32 B

**FlapBox address:** flbox

**Shutters addresses:** sh*xxx*

### Flapbox → Shutter

| Command ID (1 Byte) | Data (31 Bytes) |      *Function*      |
| ------------------- | --------------- | -------------------- |
|          1          |  Angle (1 Byte) | *Rotate the shutter* |
|          2          |        N        |*Request shutter info*|
|          ?          |        ?        |         *?*          |

### Shutter → FlapBox

| Shutter Address (5 Bytes) | Command ID (1 Byte) |         Data (26 Bytes)        |     *Function*     |
| ------------------------- | ------------------- | ------------------------------ | ------------------ |
|             X             |          1          | Temp (1 B) Hum (1 B) Lum (1 B) |*Get captors' info* |
|             ?             |          ?          |               ?                |        *?*         |
