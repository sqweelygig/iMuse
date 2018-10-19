import * as Bluebird from "bluebird";
import * as Express from "express";
import { promises as FS } from "fs";
import { JSDOM } from "jsdom";
import { forEach } from "lodash";
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

	public async attachPages(): Promise<void> {
		this.express.get("/pages/:page", async (request, response) => {
			try {
				const contentPath = Path.join("pages", `${request.params.page}.md`);
				const stylePath = Path.join("config", "style.css");
				const templatePath = Path.join(__dirname, "..", "lib", "template.html");
				const components = await Bluebird.props({
					content: this.data.get(contentPath),
					style: this.data.get(stylePath),
					template: FS.readFile(templatePath, "utf8"),
				});
				const content = marked(components.content, {
					gfm: true,
				});
				const jsDom = new JSDOM(components.template);
				const document = jsDom.window.document;
				const contentDiv = document.getElementById("page_content");
				if (contentDiv) {
					contentDiv.innerHTML = content;
				}
				const styleDiv = document.getElementById("museum_style");
				if (styleDiv) {
					styleDiv.innerHTML = components.style;
				}
				forEach(document.getElementsByTagName("a"), (link) => {
					const href = link.getAttribute("href");
					if (href && /resindevice\.io/.test(href)) {
						link.setAttribute("onclick", `return show_me("${href}", this);`);
					}
				});
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

	public async attachScripts(): Promise<void> {
		const queue = await ScriptQueue.build(this.data);
		this.express.get("/scripts/:script", async (request, response) => {
			try {
				const name = request.params.script;
				const reply = await queue.addToQueue(name);
				response.set("Access-Control-Allow-Origin", "*");
				response.send(reply.toString());
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
