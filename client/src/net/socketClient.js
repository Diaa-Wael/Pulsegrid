/**
 * Thin WebSocket wrapper: connects, auto-reconnects with backoff, and
 * forwards every raw message string straight to the parser worker
 * (see workers/dataParser.worker.js) without touching JSON on the
 * main thread.
 */
export class SocketClient {
  /**
   * @param {string} url
   * @param {Object} handlers
   * @param {(raw: string) => void} handlers.onRawMessage
   * @param {(connected: boolean) => void} handlers.onStatusChange
   */
  constructor(url, { onRawMessage, onStatusChange }) {
    this.url = url;
    this.onRawMessage = onRawMessage;
    this.onStatusChange = onStatusChange;
    this.retryDelay = 500;
    this.maxRetryDelay = 8000;
    this.socket = null;
    this._connect();
  }

  _connect() {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener('open', () => {
      this.retryDelay = 500;
      this.onStatusChange?.(true);
    });

    this.socket.addEventListener('message', (event) => {
      this.onRawMessage?.(event.data);
    });

    this.socket.addEventListener('close', () => {
      this.onStatusChange?.(false);
      this._scheduleReconnect();
    });

    this.socket.addEventListener('error', () => {
      this.socket.close();
    });
  }

  _scheduleReconnect() {
    setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetryDelay);
      this._connect();
    }, this.retryDelay);
  }

  close() {
    this.socket?.close();
  }
}
