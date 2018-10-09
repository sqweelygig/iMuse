import * as Express from 'express';
import { Dictionary } from 'lodash';
import { Gpio as PiGPIO } from 'pigpio';
import { Script } from './script';

export class Server {
	private static readonly pins = [
		new PiGPIO(
			20,
			{
				mode: PiGPIO.OUTPUT,
			},
		),
	];
	private static readonly express = Express();

	private readonly scriptsCache: Dictionary<Script> = {};

	constructor(repo: string) {
		Server.express.get('/do/:script', async (request, response) => {
			try {
				const name = request.params.script;
				if (!this.scriptsCache[name]) {
					this.scriptsCache[name] = await Script.build(repo, name, Server.pins);
				}
				this.scriptsCache[name].schedule();
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
