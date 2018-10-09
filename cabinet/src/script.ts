import * as Bluebird from "bluebird";
import { forEach, maxBy } from "lodash";
import { Gpio as Pin } from "onoff";
import * as RequestPromise from "request-promise";
import { Line } from "./line";

export class Script {
	public static async build(
		repo: string,
		name: string,
		pins: Pin[],
	): Promise<Script> {
		const script = new Script(repo, name, pins);
		await script.load();
		return script;
	}

	private static codeRegex = /<code>([\s\S]*)<\/code>/;

	public readonly name: string;

	private readonly lines: Line[];
	private readonly path: string;
	private readonly pins: Pin[];
	private timeStarted: number;

	private constructor(repo: string, name: string, pins: Pin[]) {
		this.path = `https://${repo}/scripts/${name}`;
		this.name = name;
		this.pins = pins;
		this.lines = [];
	}

	public async execute(): Promise<void> {
		this.timeStarted = new Date().getTime();
		await Bluebird.map(this.lines, (line) => {
			return line.execute();
		});
	}

	public timeLeft(): number {
		const lastLine = maxBy(this.lines, (line) => {
			return line.time;
		});
		const timeRun = this.timeStarted
			? new Date().getTime() - this.timeStarted
			: 0;
		return lastLine ? lastLine.time - timeRun : 0;
	}

	private async load(): Promise<void> {
		const page = await RequestPromise(this.path);
		const match = page.match(Script.codeRegex);
		if (!match) {
			console.error(`No script block found in ${this.path}`);
		} else {
			const code = match[1].trim();
			const lines = code.split(/[\r\n.]+/);
			forEach(lines, (line) => {
				if (line.trim() !== "") {
					this.lines.push(new Line(line, this.pins));
				}
			});
		}
	}
}
