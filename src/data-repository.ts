import * as Crypto from "crypto";
import { promises as FS } from "fs";
import * as YML from "js-yaml";
import * as OS from "os";
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
	private readonly folder: string;
	private readonly onUpdate: () => void;

	public constructor(remote: string, onUpdate: () => void) {
		this.remote = remote;
		const hash = Crypto.createHash("sha256");
		hash.update(remote);
		const folder = hash.digest("base64");
		this.folder = Path.join("/", "data", folder);
		this.onUpdate = onUpdate;
	}

	public async get(path: string): Promise<string> {
		return FS.readFile(this.getPath(path), "utf8");
	}

	public async getConfig(): Promise<Config> {
		const configString = await this.get(Path.join("config", "config.yml"));
		return YML.safeLoad(configString);
	}

	public async getContent(page: string): Promise<string> {
		return this.get(Path.join("content", `${page}.md`));
	}

	public getPath(path: string): string {
		return Path.join(this.folder, path);
	}

	public async clone(): Promise<void> {
		const keyDir = Path.join(OS.homedir(), ".ssh");
		const keyFile = Path.join(keyDir, "github");
		try {
			await FS.chmod(keyDir, "600");
		} catch (error) {
			await FS.mkdir(keyDir, "600");
		}
		await FS.writeFile(
			keyFile,
			[
				"-----BEGIN RSA PRIVATE KEY-----",
				process.env.TOKEN,
				"-----END RSA PRIVATE KEY-----",
			].join("\r\n"),
			{
				encoding: "utf8",
				mode: "600",
			},
		);

		try {
			await FS.stat(this.folder);
			await git(this.folder).pull();
		} catch (error) {
			try {
				await FS.mkdir(Path.join("/", "data"));
			} catch (error) {
				// TODO: Double check that the error is EEXIST
			}
			await FS.mkdir(this.folder);
			await git(Path.join("/", "data")).clone(this.remote, this.folder);
		}

		setInterval(async () => {
			await git(this.folder).pull();
			this.onUpdate();
		}, 5 * 60 * 1000);
	}
}
