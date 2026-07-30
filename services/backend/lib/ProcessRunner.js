import { initLogger } from './extensions/Logger';

class ProcessRunner {
    constructor(args) {
        if (!args.interval) throw new Error('"interval" required');
        if (!args.processor) throw new Error('"processor" required');
        this._timeout   = null;
        this._isRunning = false;
        this.logger     = initLogger('BuilderRunner');
        this.processor  = args.processor;
        this.interval   = args.interval;
    }

    get isRunning() {
        return this._isRunning;
    }

    start() {
        this._isRunning = true;
        this.run({ isInitial: true });
    }

    stop() {
        clearTimeout(this._timeout);
        this._isRunning = false;
    }

    async run() {
        await this.process();
        this._timeout = setTimeout(async () => {
            clearTimeout(this._timeout);
            await this.run({ isInitial: false });
        }, this.interval);
    }

    async process() {
        await this.processor.process();
    }
}

export default ProcessRunner;
