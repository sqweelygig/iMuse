import * as Express from "express";
import { ScriptQueue } from "./script-queue";

export class WebServer {
	public static async build(queue: ScriptQueue): Promise<WebServer> {
		const server = new WebServer(queue);
		await server.startListening();
		return server;
	}

	private readonly express = Express();

	private constructor(queue: ScriptQueue) {
		this.express.get("/do/:script", async (request, response) => {
			try {
				const name = request.params.script;
				const reply = await queue.addToQueue(name);
				response.send(reply);
			} catch (error) {
				console.error(error);
				response.sendStatus(500);
			}
		});
	}

	private async startListening(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.express.listen(80, () => {
				console.log("Server initialised.");
				resolve();
			});
		});
	}
}
