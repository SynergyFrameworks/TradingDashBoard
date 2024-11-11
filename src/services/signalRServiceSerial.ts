import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';
import { OptionTrade } from '../types/optionTrade';
import { store } from '../features/redux/store';
import { 
  addTrade, 
  setConnectionStatus, 
  setError, 
  updateLastConnected, 
  updateLastDisconnected,
  incrementReconnectAttempt 
} from '../features/redux/tradeSlice';

export class SignalRServiceSerial {
  private connection: HubConnection;
  private maxRetries = 5;
  private retryDelay = 5000;
  private reconnectTimeout?: number;

  constructor() {
    // Configure SignalR with MessagePack protocol
    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5076/tradehub')
      .withHubProtocol(new MessagePackHubProtocol())
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
    // Let SignalR handle the MessagePack deserialization
    this.connection.on('ReceiveTrade', (rawData: any[]) => {
      try {
        console.log('Raw SignalR data:', rawData);
    
        const tradeData = this.mapRawDataToTrade(rawData);
        
        console.log('SignalR tradeData:', tradeData);

        if (this.validateTrade(tradeData)) {
          const normalizedTrade = this.normalizeTradeData(tradeData);
          console.log('Normalized trade:', normalizedTrade);
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
      store.dispatch(incrementReconnectAttempt());
    });

    this.connection.onreconnected(() => {
      console.log('Reconnected successfully');
      store.dispatch(updateLastConnected());
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = undefined;
      }
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

    const requiredFields = ['Id', 'Timestamp', 'Symbol', 'Price', 'Quantity', 'Type'];
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


  private mapRawDataToTrade(rawData: any[]): Partial<OptionTrade> {
    return {
      Id: rawData[0]?.toString() || '',
      Timestamp: this.toISOString(rawData[1]),
      StockId: Number(rawData[2]) || 0,
      Symbol: rawData[3]?.toString() || '',
      Option: rawData[4]?.toString() || '',
      Price: this.parseDecimal(rawData[5]),
      Quantity: Number(rawData[6]) || 0,
      Type: rawData[7]?.toString().toLowerCase() || '',
      Strike: this.parseDecimal(rawData[8]),
      Expiration: this.toISOString(rawData[9]),
      IV: this.parseDecimal(rawData[10]),
      Delta: this.parseDecimal(rawData[11]),
      Gamma: this.parseDecimal(rawData[12]),
      Theta: this.parseDecimal(rawData[13]),
      Vega: this.parseDecimal(rawData[14]),
      Rho: this.parseDecimal(rawData[15]),
    };
  }
  
  

  private normalizeTradeData(data: Partial<OptionTrade>): OptionTrade {
    return {
      Id: String(data.Id || ''),
      Timestamp: this.toISOString(data.Timestamp),
      StockId: Number(data.StockId) || 0,
      Symbol: String(data.Symbol || ''),
      Option: String(data.Option || ''),
      Price: this.parseDecimal(data.Price),
      Quantity: Number(data.Quantity) || 0,
      Type: String(data.Type || '').toLowerCase(),
      Strike: this.parseDecimal(data.Strike),
      Expiration: this.toISOString(data.Expiration),
      IV: this.parseDecimal(data.IV),
      Delta: this.parseDecimal(data.Delta),
      Gamma: this.parseDecimal(data.Gamma),
      Theta: this.parseDecimal(data.Theta),
      Vega: this.parseDecimal(data.Vega),
      Rho: this.parseDecimal(data.Rho)
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
      this.scheduleReconnect();
    }
  }

  public async stop() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      await this.connection.stop();
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
