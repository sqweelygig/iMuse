import * as Bluebird from "bluebird";
import { forEach, maxBy } from "lodash";
import { Gpio as Pin } from "onoff";
import * as Path from "path";
import { DataRepository } from "./data-repository";
import { Line } from "./line";

export class Script {
	public static async build(
		data: DataRepository,
		name: string,
		pins: Pin[],
	): Promise<Script> {
		const script = new Script(data, name, pins);
		await script.load();
		return script;
	}

	private static codeRegex = /```([\s\S]*)```/;

	public readonly name: string;

	private readonly lines: Line[];
	private readonly pins: Pin[];
	private readonly data: DataRepository;
	private timeStarted?: number;

	private constructor(data: DataRepository, name: string, pins: Pin[]) {
		this.name = name;
		this.pins = pins;
		this.data = data;
		this.lines = [];
	}

	public async execute(): Promise<void> {
		this.timeStarted = new Date().getTime();
		await Bluebird.map(this.lines, (line: Line) => {
			return line.execute();
		});
		this.timeStarted = undefined;
	}

	public timeLeft(): number {
		const lastLine = maxBy(this.lines, (line: Line) => {
			return line.time;
		});
		const timeRun = this.timeStarted
			? new Date().getTime() - this.timeStarted
			: 0;
		return lastLine ? lastLine.time - timeRun : 0;
	}

	private async load(): Promise<void> {
		const path = Path.join("scripts", `${this.name}.md`);
		const page = await this.data.get(path);
		const match = page.match(Script.codeRegex);
		if (!match) {
			console.error(`No script block found in ${path}`);
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
