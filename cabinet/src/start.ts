import { ScriptQueue } from "./script-queue";
import { WebServer } from "./web-server";

async function start() {
	const queue = await ScriptQueue.build(
		process.env.SCRIPTS_REPO || "localhost",
	);
	await WebServer.build(queue);
}

start()
	.then(() => {
		console.log("Application initialised.");
	})
	.catch((error) => {
		console.error("Initialisation failed.");
		console.error(error);
	});
