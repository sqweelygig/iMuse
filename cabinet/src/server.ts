import * as Express from 'express';
import { Gpio as PiGPIO } from 'pigpio';
import { Script } from './script';

export class Server {
	private static pins = [
		new PiGPIO(
			20,
			{
				mode: PiGPIO.OUTPUT,
			},
		),
	];
	private static express = Express();

	constructor() {
		const scriptsRepo = process.env.SCRIPTS_REPO || 'localhost';

		Server.express.get('/do/:script', async (request, response) => {
			try {
				const name = request.params.script;
				const script = new Script(scriptsRepo, name, Server.pins);
				await script.load();
				script.schedule();
				response.sendStatus(200);
			} catch (error) {
				console.error(error);
				response.sendStatus(500);
			}
		});

		Server.express.listen(80, () => {
			console.log('Express server now listening.');
		});
	}
}
