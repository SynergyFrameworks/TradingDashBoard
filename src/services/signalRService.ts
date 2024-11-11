import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { OptionTrade } from '../types/optionTrade';
import { store } from '../features/redux/store';
import { 
  addTrade, 
  setServiceReset,
  clearServiceReset,
  setConnectionStats, 
  setError,
  updateLastConnected, 
  updateLastDisconnected
} from '../features/redux/tradeSlice';

export class SignalRService {
  private connection: HubConnection;
  private maxRetries = 5;
  private retryDelay = 5000;
  private reconnectTimeout?: number;;
  private performanceMonitor: PerformanceMonitor;
  private readonly RECORD_LIMIT = 200;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    
    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5076/tradehub')
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount === this.maxRetries) {
            return null;
          }
          return this.retryDelay;
        }
      })
      .configureLogging(LogLevel.Debug)
      .build();

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.connection.on('ReceiveTrade', (tradeData: any) => {
      try {
        console.log('Received trade data:', tradeData);
        this.performanceMonitor.trackMessage();
  
        if (this.validateTrade(tradeData)) {
          const normalizedTrade = this.normalizeTradeData(tradeData);
          console.log('Normalized trade:', normalizedTrade);
          
          // Check state before dispatching
          const currentState = store.getState().trades;
          if (currentState.trades.length >= this.RECORD_LIMIT) {
            // Clear and dispatch reset message
            store.dispatch(clearServiceReset());
            store.dispatch(setServiceReset(
              'Service has been reset due to memory management limits. This is a streaming demo - in production, implement proper data pagination and cleanup.'
            ));
            console.log('Service reset due to record limit');
            
            // Clear reset status after 3 seconds
            setTimeout(() => {
              store.dispatch(clearServiceReset());
            }, 3000);
          }
          
          store.dispatch(addTrade(normalizedTrade));
        } else {
          console.error('Invalid trade data:', tradeData);
          store.dispatch(setError('Received invalid trade data'));
        }
      } catch (error) {
        console.error('Error processing trade:', error);
        store.dispatch(setError('Error processing trade data'));
      }
    });

    this.connection.onclose(() => {
      console.warn('Connection closed');
      store.dispatch(updateLastDisconnected());
      this.scheduleReconnect();
    });

    this.connection.onreconnecting(() => {
      console.warn('Attempting to reconnect...');
      store.dispatch(setConnectionStats({
        ...store.getState().trades.connectionStats,
        status: 'connecting',
        reconnectAttempt: store.getState().trades.connectionStats.reconnectAttempt + 1
      }));
    });

    this.connection.onreconnected(() => {
      console.log('Reconnected successfully');
      store.dispatch(updateLastConnected());
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
      console.log('Connection Performance:', this.performanceMonitor.getMetrics());
    });
  }

  private toISOString(value: any): string {
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  private validateTrade(data: any): data is OptionTrade {
    if (!data || typeof data !== 'object') {
      console.log('Trade validation failed: not an object', data);
      return false;
    }

    const requiredFields = ['id', 'timestamp', 'symbol', 'price', 'quantity', 'type'];
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      console.log('Trade validation failed: missing fields:', missingFields);
      return false;
    }

    console.log('Trade validation passed:', data);
    return true;
  }

  private parseDecimal(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    if (value && typeof value === 'object' && 'value' in value) {
      return parseFloat(value.value);
    }
    return 0;
  }

  private normalizeTradeData(data: any): OptionTrade {
    return {
      Id: String(data.id || ''),
      Timestamp: this.toISOString(data.timestamp),
      StockId: Number(data.stockId) || 0,
      Symbol: String(data.symbol || ''),
      Option: String(data.option || ''),
      Price: this.parseDecimal(data.price),
      Quantity: Number(data.quantity) || 0,
      Type: String(data.type || '').toLowerCase(),
      Strike: this.parseDecimal(data.strike),
      Expiration: this.toISOString(data.expiration),
      IV: this.parseDecimal(data.iv),
      Delta: this.parseDecimal(data.delta),
      Gamma: this.parseDecimal(data.gamma),
      Theta: this.parseDecimal(data.theta),
      Vega: this.parseDecimal(data.vega),
      Rho: this.parseDecimal(data.rho)
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.start();
      } catch (error) {
        console.error('Reconnection failed:', error);
        store.dispatch(setError('Failed to reconnect. Will try again...'));
        store.dispatch(updateLastDisconnected()); // Ensure we stay in disconnected state
        this.scheduleReconnect();
      }
    }, this.retryDelay);
  }

  public async start() {
    try {
      await this.connection.start();
      console.log('SignalR Connected');
      store.dispatch(updateLastConnected());
    } catch (err) {
      console.error('Failed to connect:', err);
      store.dispatch(setError('Failed to connect. Retrying...'));
      store.dispatch(updateLastDisconnected()); 
      this.scheduleReconnect();
    }
  }

  public async stop() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      await this.connection.stop();
      console.log('Final Performance Metrics:', this.performanceMonitor.getMetrics());
    } catch (err) {
      console.error('Failed to stop connection:', err);
    }
  }
}


class PerformanceMonitor {
  private messageCount: number = 0;
  private startTime: number;
  private lastMessageTime: number | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  trackMessage() {
    this.messageCount++;
    this.lastMessageTime = Date.now();
  }

  reset() {
    this.messageCount = 0;
    this.startTime = Date.now();
    this.lastMessageTime = null;
  }

  getMetrics() {
    const now = Date.now();
    const duration = (now - this.startTime) / 1000;
    return {
      messagesPerSecond: this.messageCount / duration,
      totalMessages: this.messageCount,
      uptime: duration,
      lastMessageLatency: this.lastMessageTime ? now - this.lastMessageTime : null,
    };
  }
}
