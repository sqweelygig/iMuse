import { forEach } from 'lodash';
import { Gpio as PiGPIO } from 'pigpio';
import * as RequestPromise from 'request-promise';
import { Line } from './line';

export class Script {
	public static async build(repo: string, name: string, pins: PiGPIO[]): Promise<Script> {
		const script = new Script(repo, name, pins);
		await script.load();
		return script;
	}

	private static codeRegex = /<code>([\s\S]*)<\/code>/;

	private readonly lines: Line[];
	private readonly path: string;
	private readonly pins: PiGPIO[];

	private constructor(repo: string, name: string, pins: PiGPIO[]) {
		this.path = `https://${repo}/scripts/${name}`;
		this.pins = pins;
		this.lines = [];
	}

	public schedule(): void {
		forEach(this.lines, (line) => {
			line.schedule();
		});
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
				if (line.trim() !== '') {
					this.lines.push(new Line(line, this.pins));
				}
			});
		}
	}
}
