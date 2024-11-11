export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  connectTimeout?: number;  // Made optional with ?
}

export interface WebSocketState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempt: number;
  lastConnected?: Date;
  lastDisconnected?: Date;
  lastError?: string;
}