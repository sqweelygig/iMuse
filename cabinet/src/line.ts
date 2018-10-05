import { Dictionary } from 'lodash';
import { Gpio as PiGPIO } from 'pigpio';

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

	private static codeRegex = /^after ([0-9]+) ?([a-z]+) (.+) should (.+)$/;

	private readonly time: number;
	private readonly component: string;
	private readonly instruction: string;
	private readonly pins: PiGPIO[];

	// after {time} {component} should {do something}
	constructor(line: string, pins: PiGPIO[]) {
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

	public schedule(): void {
		setTimeout(
			this.execute.bind(this),
			this.time,
		);
	}

	private execute(): void {
		switch (this.component) {
			case 'socket a':
				this.pins[0].digitalWrite(this.instruction === 'turn on' ? 1 : 0);
				break;
			case 'the fx':
				break;
			default:
				console.error(`Command \`${this.component} should ${this.instruction}\` not recognised!`);
		}

	}
}
