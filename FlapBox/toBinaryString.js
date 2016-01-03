function toBinaryString(n) {
  if(n < 0 || n > 255){
    console.error("Invalid value, it has to be between 0 and 255.");
    return null;
  }
  return fillWithZero(convertToBinary(n))
}

function convertToBinary(n) {
  if(n <= 1)
    return String(n);
  else
    return convertToBinary(Math.floor(n/2)) + String(n%2);
}

function fillWithZero(value) {
  var length = value.length;
  while(length < 8) {
    value = '0' + value;
    length++;
  }
  return value;
}

exports.toBinaryString = toBinaryString;
