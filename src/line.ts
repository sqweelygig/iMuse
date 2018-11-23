import * as Bluebird from "bluebird";
import { Dictionary } from "lodash";
import { Gpio as Pin } from "onoff";

export class Line {
	private static multipliers: Dictionary<number> = {
		m: 60 * 1000,
		millisecond: 1,
		milliseconds: 1,
		min: 60 * 1000,
		mins: 60 * 1000,
		minute: 60 * 1000,
		minutes: 60 * 1000,
		ms: 1,
		s: 1000,
		sec: 1000,
		second: 1000,
		seconds: 1000,
		secs: 1000,
	};

	// after {timeOfFX} {component} should {do something}
	private static codeRegex = /^after ([0-9]+) ?([a-z]+) (.+) should (.+)$/;

	public readonly time: number;
	private readonly component: string;
	private readonly instruction: string;
	private readonly pins: Pin[];

	constructor(line: string, pins: Pin[]) {
		this.pins = pins;
		const command = line.trim().toLowerCase();
		const match = command.match(Line.codeRegex);
		if (match) {
			const base = parseInt(match[1], 10);
			const unit = match[2];
			this.time = base * Line.multipliers[unit];
			this.component = match[3];
			this.instruction = match[4];
		}
	}

	public async execute(): Promise<void> {
		await Bluebird.delay(this.time);
		switch (this.component) {
			case "socket a":
				this.pins[0].writeSync(this.instruction === "turn on" ? 1 : 0);
				break;
			case "socket b":
				this.pins[1].writeSync(this.instruction === "turn on" ? 1 : 0);
				break;
			case "the fx":
				break;
			default:
				const thing = this.component;
				const act = this.instruction;
				console.error(`Command \`${thing} should ${act}\` not recognised!`);
		}
	}
}
