import { DataCache } from "./data-cache";
import { Server } from "./server";

async function start() {
	const reportUpdate = () => {
		console.log("Data Cache Updated.");
	};
	const repo = process.env.REPO || "localhost";
	const data = new DataCache(repo, reportUpdate);
	console.log("Data Cache Initialised.");
	const server = new Server(data);
	console.log("Web Server Initialised.");
	const promises = [
		data.clone().then(() => {
			console.log("Data Cache Populated.");
		}),
		server.attachPages().then(() => {
			console.log("Page Endpoints Attached.");
		}),
		server.attachMedia().then(() => {
			console.log("Media Endpoints Attached.");
		}),
	];
	if (process.env.RESIN) {
		promises.push(
			server.attachScripts().then(() => {
				console.log("Script Endpoints Attached.");
			}),
		);
	}
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
