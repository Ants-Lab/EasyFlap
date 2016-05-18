# Protocol

**Channel :** 42

**Message size / Payload :** 12 MB

**FlapBox address:** flbox

**Shutters addresses:** sh*xxx*

### Flapbox → Shutter

| Command ID (1 Byte) | Data (11 Bytes) |     *Function*     |
| ------------------- | --------------- | ------------------ |
|          1          |  Angle (1 Byte) |*Rotate the shutter*|
|          2          |        N        |   *Ask for info*   |
|          ?          |        ?        |        *?*         |

### Shutter → FlapBox

| Shutter Address (5 Bytes) | Command ID (1 Byte) |         Data (6 Bytes)        |     *Function*     |
| ------------------------- | ------------------- | ------------------------------ | ------------------ |
|             X             |          1          | Temp (1 B) Hum (1 B) Lum (1 B) |*Get captors' info* |
|             ?             |          ?          