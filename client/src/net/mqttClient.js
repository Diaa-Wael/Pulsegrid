/**
 * Optional MQTT-over-WebSocket alternative to socketClient.js.
 * Not used by default (App.js uses plain WebSocket + the mock ws
 * server in /server). Swap it in if you point the server at a real
 * MQTT broker (e.g. Eclipse Mosquitto or EMQX with websockets enabled)
 * instead of the raw `ws` mock.
 *
 * Requires: npm install mqtt   (in client/)
 */
export class MqttClient {
  /**
   * @param {string} brokerUrl - e.g. "ws://localhost:9001"
   * @param {string} topic - e.g. "pulsegrid/updates"
   * @param {Object} handlers
   * @param {(raw: string) => void} handlers.onRawMessage
   * @param {(connected: boolean) => void} handlers.onStatusChange
   */
  constructor(brokerUrl, topic, { onRawMessage, onStatusChange }) {
    this.brokerUrl = brokerUrl;
    this.topic = topic;
    this.onRawMessage = onRawMessage;
    this.onStatusChange = onStatusChange;
    this._init();
  }

  async _init() {
    // Dynamic import so the mqtt package is only pulled in if this
    // client is actually used.
    const mqtt = await import('mqtt');
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on('connect', () => {
      this.onStatusChange?.(true);
      this.client.subscribe(this.topic);
    });

    this.client.on('message', (_topic, payload) => {
      this.onRawMessage?.(payload.toString());
    });

    this.client.on('close', () => this.onStatusChange?.(false));
    this.client.on('error', (err) => console.error('mqtt error:', err.message));
  }

  close() {
    this.client?.end();
  }
}
