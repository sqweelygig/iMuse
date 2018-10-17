import * as Bluebird from "bluebird";
import * as Express from "express";
import { JSDOM } from "jsdom";
import * as marked from "marked";
import * as Path from "path";
import { DataCache } from "./data-cache";
import { ScriptQueue } from "./script-queue";

export class Server {
	private readonly express = Express();
	private readonly data: DataCache;

	constructor(data: DataCache) {
		this.data = data;
	}

	public async attachWiki(): Promise<void> {
		this.express.get("/pages/:page", async (request, response) => {
			try {
				const path = Path.join("pages", `${request.params.page}.md`);
				const templatePath = Path.join("config", "template.html");
				const components = await Bluebird.props({
					content: this.data.get(path),
					template: this.data.get(templatePath),
				});
				const content = marked(components.content, {
					breaks: true,
					gfm: true,
				});
				const jsDom = new JSDOM(components.template);
				const document = jsDom.window.document;
				const contentDiv = document.getElementById("content");
				if (contentDiv) {
					contentDiv.innerHTML = content;
				}
				response.send(jsDom.serialize());
			} catch (error) {
				console.error(error);
				response.sendStatus(500);
			}
		});
	}

	public async attachMedia(): Promise<void> {
		this.express.get("/media/:media", async (request, response) => {
			const path = this.data.getPath(Path.join("media", request.params.media));
			response.sendFile(path, {
				dotfiles: "deny",
			});
		});
	}

	public async attachAssets(): Promise<void> {
		this.express.get("/assets/:asset", async (request, response) => {
			const path = Path.join(__dirname, "assets", request.params.asset);
			response.sendFile(path, {
				dotfiles: "deny",
			});
		});
	}

	public async attachScripts(): Promise<void> {
		const queue = await ScriptQueue.build(this.data);
		this.express.get("/scripts/:script", async (request, response) => {
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

	public async listen(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.express.listen(80, resolve);
		});
	}
}
