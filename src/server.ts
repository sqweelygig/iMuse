import * as Express from "express";
import { promises as FS } from "fs";
import * as marked from "marked";
import * as Crypto from "crypto";
import * as Mixpanel from "mixpanel";
import * as Mustache from "mustache";
import * as Path from "path";
import * as RequestPromise from "request-promise";
import { DataRepository } from "./data-repository";
import { ScriptQueue } from "./script-queue";

export class Server {
	private static mixpanelOpts = {
		protocol: "https",
	};
	private static mediaOpts = {
		dotfiles: "deny",
	};

	private readonly express = Express();
	private readonly data: DataRepository;

	constructor(data: DataRepository) {
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
					// Get details of the config, content and template
					const config = await this.data.getConfig();
					const contentMD = await this.data.getContent(request.params.page);
					const template = await FS.readFile(
						Path.join(__dirname, "..", "themes", `${config.theme}.html`),
						"utf8",
					);
					// Get the first header, used as page title
					const pageTitle = contentMD.match(/#(.*)/);
					// Convert the content to HTML
					const contentHTML = marked(contentMD, {
						gfm: true, // Github Flavoured Markdown
					});
					// Build the data payload we'll be displaying
					const data = {
						content: contentHTML,
						museum: config.title,
						page: pageTitle ? pageTitle[1].trim() : null,
					};
					// Render and send the page
					response.send(Mustache.render(template, data));
					// Record the visit to this page
					const mixpanel = Mixpanel.init(
						config.mixpanelToken,
						Server.mixpanelOpts,
					);
					mixpanel.track(`/pages/${request.params.page}`);
				} catch (error) {
					console.error(error);
					response.sendStatus(500);
				}
			},
		);
	}

	public async attachProxy(): Promise<void> {
		// TODO: [improvement] combine this with the `/scripts` endpoint ...
		// any only proxy when required.
		this.express.get(
			"/do",
			async (
				request: Express.Request,
				response: Express.Response,
				errorHandler: Express.NextFunction,
			) => {
				const cabinet = request.query.cabinet;
				const domain = "balena-devices.com";
				const script = request.query.script;
				const wotd = request.query.wotd.toLowerCase();
				const url = `https://${cabinet}.${domain}/scripts/${script}?wotd=${wotd}`;
				try {
					const scriptResponse = await RequestPromise(url);
					response.send(scriptResponse);
				} catch (error) {
					errorHandler(error);
				}
			},
		);
	}

	public async attachMedia(): Promise<void> {
		this.express.get(
			"/media/:media",
			async (request: Express.Request, response: Express.Response) => {
				const path = this.data.getPath(
					Path.join("media", request.params.media),
				);
				response.sendFile(path, Server.mediaOpts);
			},
		);
	}

	public async attachScripts(): Promise<void> {
		const queue = await ScriptQueue.build(this.data);
		this.express.get(
			"/scripts/:script",
			async (request: Express.Request, response: Express.Response) => {
				try {
					// Load the configuration
					const config = await this.data.getConfig();
					// Calculate the hash of the provided wotd
					const hash = Crypto.createHash("sha256");
					hash.update(request.query.wotd);
					if (
						hash.digest("hex").toLowerCase() === config.wotdHash.toLowerCase()
					) {
						// Add this FX script to the queue.
						const reply = await queue.addToQueue(request.params.script);
						// Send the page on its way
						response.send(reply.toString());
					} else {
						// Respond with "Unauthorised"
						response.sendStatus(401);
					}
					// Record the visit to this page
					const mixpanel = Mixpanel.init(
						config.mixpanelToken,
						Server.mixpanelOpts,
					);
					mixpanel.track(`/scripts/${request.params.script}`);
				} catch (error) {
					console.error(error);
					response.sendStatus(500);
				}
			},
		);
	}

	public async listen(): Promise<void> {
		return new Promise<void>((resolve) => {
			this.express.listen(80, resolve);
		});
	}
}
