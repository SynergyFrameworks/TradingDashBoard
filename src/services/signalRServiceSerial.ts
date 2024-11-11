import { HubConnectionBuilder, HubConnection, LogLevel, HttpTransportType } from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';
//import { ExtensionCodec, decode } from '@msgpack/msgpack';
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

// // Helper to format binary data for debugging
// const formatBinary = (data: Uint8Array, label: string) => {
//   const hexDump = Array.from(data)
//     .map(b => b.toString(16).padStart(2, '0'))
//     .join(' ');
//   const ascii = Array.from(data)
//     .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
//     .join('');
  
//   console.log(`${label} (${data.length} bytes):`);
//   console.log('Hex:', hexDump);
//   console.log('ASCII:', ascii);
//   return { hex: hexDump, ascii };
// };

// // Parse SignalR's variable-length integer encoding
// const parseVarInt = (data: Uint8Array): [number, number] => {
//   let value = 0;
//   let bytesRead = 0;
  
//   while (bytesRead < data.length) {
//     const byte = data[bytesRead];
//     value = (value << 7) | (byte & 0x7f);
//     bytesRead++;
    
//     if ((byte & 0x80) === 0) {
//       break;
//     }
//   }
  
//   return [value, bytesRead];
// };


const enum MessagePackKeys {
  Id = 0,
  Timestamp = 1,
  StockId = 2,
  Symbol = 3,
  Option = 4,
  Price = 5,
  Quantity = 6,
  Type = 7,
  Strike = 8,
  Expiration = 9,
  IV = 10,
  Delta = 11,
  Gamma = 12,
  Theta = 13,
  Vega = 14,
  Rho = 15
}


export class SignalRService {
  private connection: HubConnection;
  private maxRetries = 3;
  private retryDelay = 3000;
  private reconnectTimeout?: number;;
  private performanceMonitor: PerformanceMonitor;
  private readonly RECORD_LIMIT = 250;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();





    // const extensionCodec = new ExtensionCodec();

// Binary decoder for type 99
// extensionCodec.register({
//   type: 99,
//   encode: () => null,
//   decode: (data: Uint8Array) => {
//     try {
//       // Log the complete incoming data
//       formatBinary(data, 'Full incoming message');

//       // First byte is 0xd2 (uint32), so we'll read the next 4 bytes as length
//       if (data[0] !== 0xd2) {
//         throw new Error(`Invalid length prefix marker: ${data[0].toString(16)}`);
//       }

//       // Get the length from the next 4 bytes
//       const lengthView = new DataView(data.buffer, data.byteOffset + 1, 4);
//       const messageLength = lengthView.getInt32(0); // Use regular getInt32 for system endianness
//       console.log('Message length from prefix:', messageLength);

//       // The actual message content starts after the length bytes
//       const messageContent = data.slice(5);
//       console.log('Message content length:', messageContent.length);
//       formatBinary(messageContent, 'Message content');

//       try {
//         // First try to decode as a SignalR message array
//         const decodedMessage = decode(messageContent);
//         console.log('Decoded message:', decodedMessage);

//         // SignalR MessagePack format: [type, headers, invocationId, target, args]
//         if (Array.isArray(decodedMessage)) {
//           const messageType = decodedMessage[0];
//           const headers = decodedMessage[1];
//           const payload = decodedMessage[decodedMessage.length - 1];

//           console.log('SignalR message components:', {
//             messageType,
//             headers,
//             payload
//           });

//           // Return the actual payload (trade data)
//           return payload;
//         }

//         return decodedMessage;
//       } catch (decodeError) {
//         console.error('Initial decode failed:', decodeError);
        
//         // Try to find the start of a valid MessagePack object
//         const messageStart = messageContent.findIndex(byte => {
//           // Look for common MessagePack type markers
//           return (
//             byte === 0x80 || // map with 0 elements
//             byte === 0x90 || // array with 0 elements
//             (byte >= 0xa0 && byte <= 0xbf) || // fixstr
//             byte === 0xc0 || // nil
//             byte === 0xc2 || // false
//             byte === 0xc3    // true
//           );
//         });

//         if (messageStart !== -1) {
//           console.log(`Found potential MessagePack start at offset ${messageStart}`);
//           const potentialMessage = messageContent.slice(messageStart);
//           try {
//             const decodedChunk = decode(potentialMessage);
//             console.log('Successfully decoded chunk:', decodedChunk);
//             return decodedChunk;
//           } catch (chunkError) {
//             console.error('Failed to decode chunk:', chunkError);
//           }
//         }

//         throw decodeError;
//       }
//     } catch (error) {
//       console.error('Decoder error:', error);
//       throw error;
//     }
//   }
// });



const protocol = new MessagePackHubProtocol({
  //extensionCodec,
  // maxStrLength: 1024 * 1024,
  // maxBinLength: 1024 * 1024,
  // ignoreUndefined: true
});

    this.connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5076/tradehub', {
        skipNegotiation: false,
        transport: HttpTransportType.WebSockets,
        headers: {
          // Add any required headers
        },
        withCredentials: false 
      })
      .withHubProtocol(protocol)
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
        const trade = this.convertMessagePackTrade(tradeData);

        this.performanceMonitor.trackMessage();
  
        if (this.validateTrade(tradeData)) {
          const normalizedTrade = this.normalizeTradeData(trade);
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
            
            // Clear reset status after 2 seconds
            setTimeout(() => {
              store.dispatch(clearServiceReset());
            }, 2000);
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

  private convertMessagePackTrade(data: any): OptionTrade {
    // Handle potential array format from MessagePack
    const getValue = (key: MessagePackKeys) => {
      if (Array.isArray(data)) {
        return data[key];
      }
      return data[key.toString()];
    };

    return {
      Id: String(getValue(MessagePackKeys.Id) || ''),
      Timestamp: this.toISOString(getValue(MessagePackKeys.Timestamp)),
      StockId: Number(getValue(MessagePackKeys.StockId) || 0),
      Symbol: String(getValue(MessagePackKeys.Symbol) || ''),
      Option: String(getValue(MessagePackKeys.Option) || ''),
      Price: this.parseDecimal(getValue(MessagePackKeys.Price)),
      Quantity: Number(getValue(MessagePackKeys.Quantity) || 0),
      Type: String(getValue(MessagePackKeys.Type) || ''),
      Strike: this.parseDecimal(getValue(MessagePackKeys.Strike)),
      Expiration: this.toISOString(getValue(MessagePackKeys.Expiration)),
      IV: this.parseDecimal(getValue(MessagePackKeys.IV)),
      Delta: this.parseDecimal(getValue(MessagePackKeys.Delta)),
      Gamma: this.parseDecimal(getValue(MessagePackKeys.Gamma)),
      Theta: this.parseDecimal(getValue(MessagePackKeys.Theta)),
      Vega: this.parseDecimal(getValue(MessagePackKeys.Vega)),
      Rho: this.parseDecimal(getValue(MessagePackKeys.Rho)),
     // Stock: undefined // Stock relation is ignored in MessagePack serialization
    };
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
