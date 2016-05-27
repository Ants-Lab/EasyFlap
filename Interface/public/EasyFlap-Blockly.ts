enum captorType { brightness, humidity, temperature, position }

interface Captor {
	type: captorType,
	value: number
}

interface Shutter {
	loc: string,
	captors: Captor[],
	id: number,
	targetAngle: number
}

/**
 * EasyFlap
 */
class EasyFlap {

	public Shutters = [];
	private shutters : Shutter[];
	
	constructor(shutters: Shutter[], socketio) {

		for (let shutter of shutters) 
			this.Shutters.push(shutter.id);

		this.shutters = shutters;	

	}

	runEvery(callBack : Function, timeMs: number) {

		switch (timeMs) {
			case 60:
				
				break;
		
			default:
				break;
		}
	}

	setAngle(shutter: Shutter, angle) {

		angle = Math.abs(angle) % 180;

	}
	
	closeShutter(shutter: Shutter) {
		
		
	}

	getCaptorValue(shutterId, parameter) {
		for (let sh of this.shutters)  {
			if (sh.id === shutterId)  {

				switch (parameter) {
					case "position":

						for (let captor of sh.captors) {
							if (captor.type === captorType.position)
								return captor.value;
						}

						break;						
						
					case "brightness":

						for (let captor of sh.captors) {
							if (captor.type === captorType.brightness)
								return captor.value;
						}

						break;

					case "temperature":

						for (let captor of sh.captors) {
							if (captor.type === captorType.temperature)
								return captor.value;
						}

						break;

					case "humidity":

						for (let captor of sh.captors) {
							if (captor.type === captorType.humidity)
								return captor.value;
						}

						break;					

					default:
						console.log("Unknown captor");
						break;						
				}
				
			}
		}
	}	
}