import * as Bluebird from "bluebird";
import * as Express from "express";
import { promises as FS } from "fs";
import * as YML from "js-yaml";
import { JSDOM } from "jsdom";
import { forEach } from "lodash";
import * as marked from "marked";
import * as Mixpanel from "mixpanel";
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
		this.express.get(
			"/",
			async (_request: Express.Request, response: Express.Response) => {
				response.redirect("/pages/home");
			},
		);

		this.express.get(
			"/pages/:page",
			async (request: Express.Request, response: Express.Response) => {
				try {
					// Load resources from the data and library
					const paths = {
						config: Path.join("config", "config.yml"),
						content: Path.join("pages", `${request.params.page}.md`),
						script: Path.join("config", "script.js"),
						style: Path.join("config", "style.css"),
						template: Path.join(__dirname, "..", "lib", "template.html"),
					};
					const components = await Bluebird.props({
						config: this.data.get(paths.config),
						content: this.data.get(paths.content),
						script: this.data.get(paths.script),
						style: this.data.get(paths.style),
						template: FS.readFile(paths.template, "utf8"),
					});
					const config = YML.safeLoad(components.config);
					// Grab the document for server-side manipulation
					const jsDom = new JSDOM(components.template);
					const document = jsDom.window.document;
					// Inject the content in the page
					const contentDiv = document.getElementById("page_content");
					const content = marked(components.content, {
						gfm: true,
					});
					if (contentDiv) {
						contentDiv.innerHTML = content;
					}
					// Inject the style in the page
					const styleDiv = document.getElementById("museum_style");
					if (styleDiv) {
						styleDiv.innerHTML = components.style;
					}
					// Inject the script in the page
					const scriptDiv = document.getElementById("museum_script");
					if (scriptDiv) {
						scriptDiv.innerHTML = components.script;
					}
					// Inject the title in the page
					const pageTitle = components.content.match(/#(.*)/);
					const titleDiv = document.getElementById("museum_page_title");
					if (pageTitle && titleDiv) {
						titleDiv.innerHTML = `${config.title} / ${pageTitle[1]}`;
					}
					// Manipulate links that reference resindevice.io
					forEach(document.getElementsByTagName("a"), (element) => {
						const href = element.getAttribute("href");
						if (href && /resindevice\.io/.test(href)) {
							const click = ["new ShowMe(this);", "return false;"].join(" ");
							element.setAttribute("onclick", click);
						}
					});
					// Send the page on its way
					response.send(jsDom.serialize());
					// Record the visit to this page
					const mixpanel = Mixpanel.init(config.mixpanelToken, {
						protocol: "https",
					});
					mixpanel.track(`/pages/${request.params.page}`);
				} catch (error) {
					console.error(error);
					response.sendStatus(500);
				}
			},
		);
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
				// Add this FX script to the queue.
				const reply = await queue.addToQueue(request.params.script);
				// Send the page on its way
				response.set("Access-Control-Allow-Origin", "*");
				response.send(reply.toString());
				// Load the configuration, for the mixpanel token
				const configString = await this.data.get(
					Path.join("config", "config.yml"),
				);
				const config = YML.safeLoad(configString);
				// Record the visit to this page
				const mixpanel = Mixpanel.init(config.mixpanelToken, {
					protocol: "https",
				});
				mixpanel.track(`/scripts/${request.params.script}`);
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
