import * as Crypto from "crypto";
import { promises as FS } from "fs";
import * as YML from "js-yaml";
import * as Path from "path";
import * as git from "simple-git/promise";

declare interface Config {
	mixpanelToken: string;
	title: string;
	theme: string;
	wotdHash: string;
}

export class DataRepository {
	private readonly remote: string;
	private readonly dataFolder: string;
	private readonly onUpdate: () => void;

	public constructor(remote: string, onUpdate: () => void) {
		this.remote = remote;
		const hash = Crypto.createHash("sha256");
		hash.update(remote);
		const folder = hash.digest("base64");
		this.dataFolder = Path.join("/", "data", folder);
		this.onUpdate = onUpdate;
	}

	public async get(path: string): Promise<string> {
		return FS.readFile(this.getDataPath(path), "utf8");
	}

	public async getConfig(): Promise<Config> {
		const configString = await this.get(Path.join("config", "config.yml"));
		return YML.safeLoad(configString);
	}

	public async getContent(page: string): Promise<string> {
		return this.get(Path.join("content", `${page}.md`));
	}

	public getDataPath(path: string): string {
		return Path.join(this.dataFolder, path);
	}

	public async clone(): Promise<void> {
		const keyFile = Path.join("/", "usr", "src", "imuse", ".ssh", "github");
		await FS.writeFile(
			keyFile,
			[
				"-----BEGIN RSA PRIVATE KEY-----",
				process.env.TOKEN,
				"-----END RSA PRIVATE KEY-----",
			].join("\r\n"),
			{
				encoding: "utf8",
				flag: "w",
				mode: "700",
			},
		);
		await FS.chmod(keyFile, "700");

		try {
			await FS.stat(this.dataFolder);
			await git(this.dataFolder).pull();
		} catch (error) {
			await FS.mkdir(this.dataFolder);
			await git(Path.join("/", "data")).clone(this.remote, this.dataFolder);
		}

		setInterval(async () => {
			await git(this.dataFolder).pull();
			this.onUpdate();
		}, 5 * 60 * 1000);
	}
}
