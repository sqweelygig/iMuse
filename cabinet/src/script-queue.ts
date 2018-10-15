import { reduce } from "lodash";
import { Gpio as Pin } from "onoff";
import { Script } from "./script";

export class ScriptQueue {
	public static async build(repository: string): Promise<ScriptQueue> {
		return new ScriptQueue(repository);
	}

	private scriptRunning?: Script;

	private readonly queue: Script[] = [];

	private readonly pins: Pin[] = [];

	private readonly repository: string;

	private constructor(repository: string) {
		this.pins[0] = new Pin(20, "out");
		this.pins[1] = new Pin(26, "out");
		console.log("Pins initialised.");
		this.repository = repository;
	}

	public async addToQueue(name: string): Promise<object> {
		const currentScriptTimeRemaining = this.scriptRunning
			? this.scriptRunning.timeLeft()
			: 0;
		const foundIndex = this.queue.findIndex((eachScript) => {
			return eachScript.name === name;
		});
		const scriptsAheadTimeRemaining = reduce(
			foundIndex === -1 ? this.queue : this.queue.slice(0, foundIndex),
			(sum, eachScript) => {
				return sum + eachScript.timeLeft();
			},
			0,
		);
		if (foundIndex === -1) {
			const script = await Script.build(this.repository, name, this.pins);
			this.queue.push(script);
			this.kickQueue();
		}
		return {
			ETA: scriptsAheadTimeRemaining + currentScriptTimeRemaining,
			timestamp: new Date().getTime(),
		};
	}

	private kickQueue() {
		if (this.scriptRunning === undefined) {
			this.nextInQueue().then(/*do nothing*/);
		}
	}

	private async nextInQueue() {
		this.scriptRunning = this.queue.shift();
		if (this.scriptRunning) {
			await this.scriptRunning.execute();
			await this.nextInQueue();
		}
	}
}
