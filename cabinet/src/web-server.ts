import * as Express from "express";
import { ScriptQueue } from "./script-queue";

export class WebServer {
	private readonly express: Express.Express;

	public constructor(queue: ScriptQueue) {
		this.express = Express();
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
		this.express.listen(80, () => {
			console.log("Server initialised.");
		});
	}
}
