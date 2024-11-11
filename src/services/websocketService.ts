import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { timer, Subject, EMPTY, BehaviorSubject } from 'rxjs';
import { WebSocketConfig, WebSocketState} from '../types/websocket';
import { 
  retryWhen, 
  delay, 
  tap, 
  catchError, 
  takeUntil, 
  timeout,
  switchMap
} from 'rxjs/operators';
import { Store } from '@reduxjs/toolkit';
import { 
  addTrade,
  setError,
  setConnectionStats,
  updateLastConnected,
  updateLastDisconnected
} from '../features/redux/tradeSlice';

export class WebSocketService {
  private socket$?: WebSocketSubject<any>;
  private wsConfig: WebSocketConfig;
  private store: Store;
  private destroy$ = new Subject<void>();
  private reconnecting$ = new BehaviorSubject<boolean>(false);
  private heartbeat$?: any;
  private missedHeartbeats = 0;
  private connectionState$ = new BehaviorSubject<WebSocketState>({
    status: 'disconnected',
    reconnectAttempt: 0
  });

  constructor(
    store: Store, 
    config: Partial<WebSocketConfig> = {
      url: 'ws://localhost:5000/ws',
      reconnectAttempts: 5,
      initialRetryDelay: 1000,
      maxRetryDelay: 30000,
      connectTimeout: 5000
    }
  ) {
    this.store = store;
    this.wsConfig = {
      url: config.url || 'ws://localhost:5000/ws',
      reconnectAttempts: config.reconnectAttempts ?? 5,
      initialRetryDelay: config.initialRetryDelay ?? 1000,
      maxRetryDelay: config.maxRetryDelay ?? 30000,
      connectTimeout: config.connectTimeout ?? 5000
    };
    this.initializeWebSocket();
    this.setupConnectionStateMonitoring();
  }

  private setupConnectionStateMonitoring() {
    this.connectionState$.subscribe(state => {
      // Update connection state based on status
      if (state.status === 'connected') {
        this.store.dispatch(updateLastConnected());
      } else if (state.status === 'disconnected') {
        this.store.dispatch(updateLastDisconnected());
      }

      // Update connection stats
      this.store.dispatch(setConnectionStats({
        reconnectAttempt: state.reconnectAttempt,
        lastConnected: state.lastConnected,
        lastDisconnected: state.lastDisconnected,
        status: state.status
      }));

      if (state.lastError) {
        this.store.dispatch(setError(state.lastError));
      }
    });
  }

  private initializeWebSocket() {
    try {
      if (this.socket$) {
        this.socket$.complete();
      }

      this.socket$ = webSocket({
        url: this.wsConfig.url,
        openObserver: {
          next: () => {
            this.handleConnection();
          }
        },
        closeObserver: {
          next: () => {
            this.handleDisconnection();
          }
        },
        deserializer: this.deserializeMessage,
      });

      this.subscribeToWebSocket();
    } catch (error) {
      this.handleError('Failed to initialize WebSocket', error);
    }
  }

  private deserializeMessage(event: MessageEvent) {
    try {
      if (event.data === 'PING') {
        return { type: 'PING' };
      }
      return JSON.parse(event.data);
    } catch (error) {
      console.error('Message deserialization failed:', error);
      return null;
    }
  }

  private subscribeToWebSocket() {
    if (!this.socket$) return;

    this.socket$
      .pipe(
        timeout(this.wsConfig.connectTimeout || 5000),  // Provide default value
        catchError(error => {
          if (error.name === 'TimeoutError') {
            this.handleError('Connection timeout', error);
          } else {
            this.handleError('WebSocket error', error);
          }
          return EMPTY;
        }),
        retryWhen(errors => 
          errors.pipe(
            tap(error => {
              const state = this.connectionState$.value;
              if (state.reconnectAttempt >= (this.wsConfig.reconnectAttempts || 5)) {
                throw error;
              }
              this.handleReconnection();
            }),
            delay(this.calculateRetryDelay()),
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (message: any) => {
          this.handleMessage(message);
        },
        error: (error) => {
          this.handleError('WebSocket subscription error', error);
        },
        complete: () => {
          this.handleDisconnection();
        }
      });
  }

  private calculateRetryDelay(): number {
    const attempt = this.connectionState$.value.reconnectAttempt;
    const initialDelay = this.wsConfig.initialRetryDelay || 1000;
    const maxDelay = this.wsConfig.maxRetryDelay || 30000;
    
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      initialDelay * Math.pow(2, attempt),
      maxDelay
    );
    
    // Add random jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  private handleConnection() {
    this.connectionState$.next({
      ...this.connectionState$.value,
      status: 'connected',
      lastConnected: new Date(),
      lastError: undefined,
      reconnectAttempt: 0
    });
  
    this.startHeartbeat();
  }

  private handleDisconnection() {
    this.stopHeartbeat();
    
    const now = new Date();
    this.connectionState$.next({
      ...this.connectionState$.value,
      status: 'disconnected',
      lastDisconnected: now
    });
  }

  private handleReconnection() {
    const state = this.connectionState$.value;
    this.connectionState$.next({
      ...state,
      status: 'connecting',
      reconnectAttempt: state.reconnectAttempt + 1
    });
  }

  private handleError(context: string, error: any) {
    const errorMessage = `${context}: ${error.message || 'Unknown error'}`;
    console.error(errorMessage, error);
    
    this.connectionState$.next({
      ...this.connectionState$.value,
      status: 'error',
      lastError: errorMessage
    });
  }

  private handleMessage(message: any) {
    try {
      if (message.type === 'PING') {
        this.handlePing();
        return;
      }

      // Reset missed heartbeats on any message
      this.missedHeartbeats = 0;

      if (message && typeof message === 'object') {
        this.store.dispatch(addTrade(message));
      }
    } catch (error) {
      this.handleError('Message processing error', error);
    }
  }

  private startHeartbeat() {
    // Send heartbeat every 30 seconds
    this.heartbeat$ = timer(0, 30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.missedHeartbeats >= 2) {
          this.handleHeartbeatTimeout();
          return;
        }

        this.missedHeartbeats++;
        this.socket$?.next({ type: 'PING' });
      });
  }

  private handlePing() {
    this.missedHeartbeats = 0;
    this.socket$?.next({ type: 'PONG' });
  }

  private handleHeartbeatTimeout() {
    this.handleError('Heartbeat timeout', new Error('Server not responding'));
    this.reconnect();
  }

  private stopHeartbeat() {
    if (this.heartbeat$) {
      this.heartbeat$.unsubscribe();
      this.heartbeat$ = undefined;
    }
  }

  public reconnect() {
    if (this.reconnecting$.value) return;

    this.reconnecting$.next(true);
    this.initializeWebSocket();
    this.reconnecting$.next(false);
  }

  public disconnect() {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket$?.complete();
    this.stopHeartbeat();
  }

  public getConnectionState() {
    return this.connectionState$.asObservable();
  }
}