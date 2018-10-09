import * as RequestPromise from "request-promise";
import { ScriptQueue } from "./script-queue";
import { WebServer } from "./web-server";

function requestReboot(report?: string) {
	console.error(report || "Previous boot still controlling resources.");
	if (!process.env.DEBUG__DO_NOT_REBOOT) {
		console.error("Requesting reboot.");
		const address = process.env.RESIN_SUPERVISOR_ADDRESS;
		const key = process.env.RESIN_SUPERVISOR_API_KEY;
		RequestPromise.post(`${address}/v1/reboot?apikey=${key}`);
	}
}

try {
	const queue = new ScriptQueue(process.env.SCRIPTS_REPO || "localhost");
	// tslint:disable-next-line no-unused-expression
	new WebServer(queue);
	console.log("Application initialised.");
} catch (error) {
	console.log("What we've got here is a failure to initialise.");
	console.error(error);
	requestReboot();
}
