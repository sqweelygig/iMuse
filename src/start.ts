import { DataCache } from "./data-cache";
import { Server } from "./server";

async function start() {
	const reportUpdate = () => {
		console.log("Data Store Updated.");
	};
	const repo = process.env.REPO || "localhost";
	const data = new DataCache(repo, reportUpdate);
	console.log("Data Store Initialised.");
	const server = new Server(data);
	console.log("Web Server Initialised.");
	const promises = [
		data.clone().then(() => {
			console.log("Data Store Populated.");
		}),
		server.attachWiki().then(() => {
			console.log("Wiki Endpoints Attached.");
		}),
		server.attachMedia().then(() => {
			console.log("Media Endpoints Attached.");
		}),
		server.attachAssets().then(() => {
			console.log("Asset Endpoints Attached.");
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
