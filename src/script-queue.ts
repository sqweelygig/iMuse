import { reduce } from "lodash";
import { Gpio as Pin } from "onoff";
import { DataCache } from "./data-cache";
import { Script } from "./script";

export class ScriptQueue {
	public static async build(data: DataCache): Promise<ScriptQueue> {
		const queue = new ScriptQueue(data);
		console.log("Pins initialised.");
		return queue;
	}

	private scriptRunning?: Script;

	private readonly queue: Script[] = [];

	private readonly pins: Pin[] = [];

	private readonly data: DataCache;

	private constructor(data: DataCache) {
		this.pins[0] = new Pin(20, "out");
		this.pins[1] = new Pin(26, "out");
		this.data = data;
	}

	public async addToQueue(name: string): Promise<number> {
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
			const script = await Script.build(this.data, name, this.pins);
			this.queue.push(script);
			this.kickQueue();
		}
		return (
			scriptsAheadTimeRemaining +
			currentScriptTimeRemaining +
			new Date().getTime()
		);
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
