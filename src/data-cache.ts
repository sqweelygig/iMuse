import { promises as FS } from "fs";
import * as md5 from "md5";
import * as OS from "os";
import * as Path from "path";
import * as git from "simple-git/promise";

export class DataCache {
	private readonly remote: string;
	private readonly folder: string;
	private readonly onUpdate: () => void;

	public constructor(remote: string, onUpdate: () => void) {
		this.remote = remote;
		this.folder = Path.join("/", "data", md5(remote));
		this.onUpdate = onUpdate;
	}

	public async get(path: string): Promise<string> {
		return FS.readFile(this.getPath(path), "utf8");
	}

	public getPath(path: string): string {
		return Path.join(this.folder, path);
	}

	public async clone(): Promise<void> {
		const keys = Path.join(OS.homedir(), ".ssh");
		const file = Path.join(keys, "github");

		try {
			await FS.chmod(keys, "600");
		} catch (error) {
			await FS.mkdir(keys, "600");
		}
		await FS.writeFile(
			file,
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

		await FS.mkdir(Path.join("/", "data"));
		await FS.mkdir(this.folder);

		try {
			await git(this.folder).pull();
		} catch (error) {
			await git(Path.join("/", "data")).clone(this.remote, this.folder);
		}
		setInterval(async () => {
			await git(this.folder).pull();
			this.onUpdate();
		}, 5 * 60 * 1000);
	}
}
