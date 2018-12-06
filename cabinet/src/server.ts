import * as Crypto from "crypto";
import * as Express from "express";
import { DataRepository } from "./data-repository";
import { ScriptQueue } from "./script-queue";

export class Server {
	private readonly express = Express();
	private readonly data: DataRepository;

	constructor(data: DataRepository) {
		this.data = data;
	}

	public async attachScripts(): Promise<void> {
		const queue = await ScriptQueue.build(this.data);
		this.express.get(
			"/scripts/:script",
			async (request: Express.Request, response: Express.Response) => {
				try {
					// Load the configuration
					const config = await this.data.getConfig();
					// Calculate the hash of the provided wotd
					const hash = Crypto.createHash("sha256");
					hash.update(request.query.wotd);
					if (
						hash.digest("hex").toLowerCase() === config.wotdHash.toLowerCase()
					) {
						// Add this FX script to the queue.
						const reply = await queue.addToQueue(request.params.script);
						// Send the page on its way
						response.send(reply.toString());
					} else {
						// Respond with "Unauthorised"
						response.sendStatus(401);
					}
				} catch (error) {
					console.error(error);
					response.sendStatus(500);
				}
			},
		);
	}

	public async listen(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.express.listen(process.env.PORT || 80, resolve);
		});
	}
}
