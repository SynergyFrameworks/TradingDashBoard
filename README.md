
# React SignalR WebSocket Trading Dashboard: - npm start 

is a demonstrator of real-time financial market monitoring application that provides a demonstration of live streaming of options trading data. Built using React and SignalR, it offers a comprehensive view of market activities with a focus on options trading analytics and visualization.

# Key Features:
- Live streaming of options trading data via WebSocket connection
- Real-time trade monitoring with pause/resume capabilities
- Interactive charting for price and volume analysis
- Portfolio analytics with Greeks calculations
- Options type distribution analysis (Calls/Puts)
- Advanced filtering and sorting capabilities

# Technical Overview:
The application is built on a modern React stack, utilizing Redux for state management and Material-UI for the user interface. It implements WebSocket connectivity through SignalR to maintain a persistent connection with the trading data stream. The system includes sophisticated memory management features to handle high-frequency trading data, implementing automatic buffer clearing to prevent memory overflow while maintaining smooth performance.

# Data Visualization:
The dashboard presents trading data through multiple interactive charts and analytical views powered by the Recharts library. Users can analyze trading patterns, volume distribution, and key market indicators through various visualization tools. The interface provides both aggregate views and detailed drill-downs of trading activities.

# Architecture Highlights:
- Modular component structure for maintainability
- Real-time state management with Redux
- Efficient data streaming with automatic buffer management
- Responsive design for various screen sizes
- Robust error handling and connection management
- Performance-optimized rendering for real-time updates

This application serves as a demonstration of modern web technologies handling real-time financial data, showcasing both technical capabilities and practical trading analytics features.

Target Users:
- Financial market analysts
- Options traders
- Portfolio managers
- Market data researchers
- Trading system developers

The system demonstrates professional-grade capabilities in handling real-time market data while maintaining a user-friendly interface suitable for both technical and non-technical users in the financial trading sector.

# .Net 8 TradeGenerator Service: - dotnet run (http)

This is the main service responsible for generating and managing the stock trades.
It has the following functionality:

Starts and stops generating trades for a specific connection ID.
Sends the generated trades to the connected clients using SignalR.
Maintains a history of the generated trades.
Calculates various trade statistics, such as total volume, total value, average price, and IV spread.

# TradeHub (SignalR Hub):

This is the SignalR hub that handles the real-time communication between the clients and the server.
It has the following functionality:

Starts generating trades when a client connects.
Stops generating trades when a client disconnects.
Sends the generated trades to the connected clients.

This is a real-time options trading data simulator using SignalR. Here's what it does:

# Main Functionality:

Generates simulated options trade data for 35 major stocks (AAPL, GOOGL, MSFT, etc.)
Creates random trades with realistic options data including:

Price, quantity, strike price
Greeks (Delta, Gamma, Theta, Vega, Rho)
Implied Volatility (IV)

Broadcasts trades in real-time to connected clients
Maintains a historical trade record

# To run the service:  *No certificate requred, Service runs on *Http*

dotnet run
The service will start on http://localhost:5000 or similar port (check console output)

What to expect:
The service creates a WebSocket endpoint at /tradehub

When a client connects:
Random trades are generated every 100-1000ms
Each trade is sent to the connected client
Trades are also sent to symbol-specific groups
Trades are logged to console

# To test/connect:

You can use a SignalR client (JavaScript, .NET, etc.)
The endpoint accepts websocket connections with CORS enabled
Clients will receive trades via the "ReceiveTrade" and "ReceiveSymbolTrade" methods

# SignalR MessagePack Integration Issues When Enabling binary ecoding with or without compression
*Core Problems Encountered*
*Binary Format Mismatch*

The data arrived as [ExtData, Uint8Array] array
First element was ExtData with type 98 (MessagePack extension type)
Second element was Uint8Array containing binary data
The raw format showed patterns like: f0 87 dc 00 10 d9 24 39
Each attempt to parse resulted in "Incomplete message" errors

# Protocol Layer Incompatibilities

SignalR's binary message format expected a specific structure:

*Length prefix (4 bytes)*
*Message type (4 bytes)*
*Actual message content*

Attempts to reconstruct this format from the raw data failed
The C# to TypeScript translation of complex types was problematic

# SignalR MessagePackHubProtocol Issues

The MessagePackHubProtocol in TypeScript expected different formatting than what was being sent
The parseMessages() method consistently failed with "Invalid input" or "Incomplete message" errors
Binary format headers weren't properly aligned between .NET and TypeScript implementations

# Implementation Challenges

*Binary Data Handling*
typescriptCopy// Attempts to handle the binary data included:
*Direct Uint8Array usage*
*ArrayBuffer conversions*
*Binary message reconstruction*
*Manual header construction*

# Data Extraction Attempts
typescriptCopy// Various approaches tried:
*MessagePack protocol direct parsing*
*Manual binary data extraction*
*Custom binary message formatting*
*TextDecoder for JSON conversion*

# Protocol Compatibility
*MessagePackCompression has two modes, Lz4Block, Lz4BlockArray and None*  11/11/2024
*C# server serialized objects differently than TypeScript expected*
*Extension type (98) handling wasn't clear in the TypeScript implementation*
*Binary message framing differed between platforms*


# Root Cause Analysis
The fundamental issue appears to be:
*Different MessagePack implementations between .NET and TypeScript*
*SignalR's binary protocol adds complexity that isn't fully compatible across platforms*
*The TypeScript MessagePack protocol implementation may not fully support all .NET MessagePack features*

# Solution
The best temp solution was to:

*Remove MessagePack protocol entirely*
*Use standard JSON serialization*
*Let SignalR handle the serialization/deserialization natively*
*Focus on proper type mapping and validation after receiving the data*

This simplified approach proved more reliable and maintainable while still maintaining good performance characteristics.


# StartGeneratingTrades_ShouldGenerateValidTrades

Tests the real-time trade generation system
Verifies trades are created with valid properties (price, symbol, timestamp)
Confirms trades are properly sent through SignalR


# CalculateStatistics_ShouldCalculateCorrectValues

Tests statistical calculations with sample trade data
Verifies weighted calculations for price, volume, and Greeks (Delta, Gamma, etc.)
Checks that complex calculations like weighted averages are accurate


# CalculateStatistics_WithEmptyTrades_ShouldReturnEmptyStatistics

Tests edge case with no trades
Verifies proper initialization of statistics with zero values
Ensures system handles empty data sets gracefully



The test suite uses Moq for SignalR mocking and FluentAssertions for readable assertions, focusing on both the real-time and analytical aspects of the trade generator system.


# Jest testing enabled in the React Project and various tests are set up.

1. Run all tests once:
```bash
npm test
```
2. Run tests in watch mode (recommended during development):
```bash
npm test --watch
```
4. Run tests with coverage:
```bash
npm test --coverage
```

## Watch Mode Commands
When in watch mode, you can:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `q` to quit watch mode
- Press `p` to filter by a filename regex pattern
- Press `t` to filter by a test name regex pattern

