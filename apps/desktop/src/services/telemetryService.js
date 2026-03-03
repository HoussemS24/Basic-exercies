const fs = require('fs');
const path = require('path');
const os = require('os');

class TelemetryService {
  constructor(configService) {
    this.configService = configService;
    this.dataDir = path.join(os.homedir(), '.atio-agent', 'telemetry');
    this.bufferPath = path.join(this.dataDir, 'events.jsonl');
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  track(eventName, attrs = {}) {
    const config = this.configService.getMergedConfig();
    if (!config.telemetryOptIn) return { buffered: false };
    const safeAttrs = { ...attrs };
    delete safeAttrs.prompt;
    delete safeAttrs.response;
    const envelope = {
      eventId: `${Date.now()}-${Math.random()}`,
      eventName,
      ts: new Date().toISOString(),
      attrs: safeAttrs
    };
    fs.appendFileSync(this.bufferPath, `${JSON.stringify(envelope)}\n`, 'utf8');
    return { buffered: true };
  }
}

module.exports = { TelemetryService };
