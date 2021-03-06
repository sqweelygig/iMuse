import { DataRepository } from "./data-repository";
import { Server } from "./server";

async function start() {
	const reportUpdate = () => {
		console.log("Data Repository Updated.");
	};
	const repo = process.env.REPO || "localhost";
	const data = new DataRepository(repo, reportUpdate);
	console.log("Data Cache Initialised.");
	const server = new Server(data);
	console.log("Web Server Initialised.");
	const promises = [
		data.clone().then(() => {
			console.log("Data Repository Populated.");
		}),
		server.attachScripts().then(() => {
			console.log("Script Endpoints Attached.");
		}),
	];
	await Promise.all(promises);
	await server.listen();
	console.log("Server Accepting Requests.");
}

start()
	.then(() => {
		console.log("Application Initialised.");
	})
	.catch((error) => {
		console.error("Initialisation Failed.");
		console.error(error);
	});
