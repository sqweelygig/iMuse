import { promises as FS } from "fs";
import * as md5 from "md5";
import * as OS from "os";
import * as Path from "path";
import * as git from "simple-git/promise";

export class DataCache {
	private readonly repo: string;
	private readonly folder: string;
	private readonly token: string;
	private readonly onUpdate: () => void;

	public constructor(repository: string, onUpdate: () => void) {
		this.repo = repository;
		this.folder = Path.join("/", "data", "/", md5(repository));
		console.log(this.folder);
		this.token = [
			"-----BEGIN RSA PRIVATE KEY-----",
			process.env.TOKEN,
			"-----END RSA PRIVATE KEY-----",
		].join("\r\n");
		this.onUpdate = onUpdate;
	}

	public async get(path: string): Promise<string> {
		return FS.readFile(this.getPath(path), "utf8");
	}

	public getPath(path: string): string {
		return Path.join(this.folder, path);
	}

	public async clone(): Promise<void> {
		const home = OS.homedir();
		const keys = Path.join(home, ".ssh");
		const file = Path.join(keys, "github");

		try {
			await FS.chmod(keys, "600");
		} catch (error) {
			await FS.mkdir(keys, "600");
		}
		await FS.writeFile(file, this.token, {
			encoding: "utf8",
			mode: "600",
		});

		await FS.rmdir(this.folder);
		await git().clone(this.repo, this.folder);
		setInterval(async () => {
			await git(this.folder).pull();
			this.onUpdate();
		}, 5 * 60 * 1000);
	}
}
