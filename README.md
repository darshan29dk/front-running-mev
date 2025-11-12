# 🚀 MEV Detector - Real-Time Front-Running Protection

A full-stack dApp that detects and protects against MEV (Miner Extractable Value) attacks, sandwich attacks, and front-running in real-time on Ethereum.

## 🌟 Features

### Core Protection
- **Real-Time MEV Detection**: Monitor the mempool using Alchemy API and detect potential sandwich/front-running attacks instantly
- **Attack Classification**: Identify attack types (sandwich, front-run, back-run, generalized MEV)
- **Risk Scoring**: Proprietary algorithm assigns risk scores (0-100%) to pending transactions
- **Slippage Analysis**: Calculate potential slippage losses from MEV attacks

### User Features
- **Interactive Dashboard**: Real-time attack feed with charts and statistics
- **Transaction Simulator**: Test trades before submitting to see MEV risk
- **Flashbots Integration**: Send transactions privately via Flashbots Protect to avoid MEV bots
- **Premium Features**: ETH-based micropayments for advanced protection and analytics
- **Real-Time Alerts**: WebSocket-powered live notifications for detected attacks

### Technical Highlights
- **Alchemy Mempool Monitoring**: Poll pending transaction pool and analyze patterns
- **Flashbots Private Relay**: Hide transactions from MEV bots
- **On-Chain Payment**: ETH micropayments for premium features
- **Historical Analytics**: Track attack patterns over time
- **Beautiful UI**: React + Tailwind CSS dashboard with real-time charts

## 🏗️ Architecture

```
mev-detector/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── utils/           # API & Web3 utilities
│   │   └── App.tsx          # Main application
│   └── package.json
│
└── server/                   # Node.js + Express backend
    ├── src/
    │   ├── services/        # Alchemy, Flashbots, Payments
    │   ├── utils/           # MEV detection logic
    │   ├── routes/          # API endpoints
    │   └── server.ts        # Express server
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Alchemy API key (free at https://www.alchemy.com/)
- MetaMask wallet for testing

### 1. Backend Setup

```bash
cd server
npm install
```

Create `.env` file:
```env
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_ENDPOINT_MAINNET=https://eth-mainnet.g.alchemy.com/v2/
ALCHEMY_ENDPOINT_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/
FLASHBOTS_RELAY_URL=https://relay.flashbots.net
PORT=5000
NETWORK=sepolia
PREMIUM_FEATURE_FEE=0.001
SIMULATION_FEE=0.0001
```

Start backend:
```bash
npm run dev
```

Backend runs at `http://localhost:5000`

### 2. Frontend Setup

```bash
cd mev-detector
npm install
```

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
REACT_APP_NETWORK=sepolia
```

Start frontend:
```bash
npm start
```

Frontend runs at `http://localhost:3000`

## 📡 API Endpoints

### Health & Stats
```
GET /api/health                    # Health check
GET /api/stats                     # Global statistics
GET /api/gas-prices                # Current gas prices
```

### Attacks
```
GET /api/attacks?limit=50          # Get recent attacks
GET /api/attacks/:id               # Get attack details
POST /api/mempool/scan             # Trigger manual scan
```

### Transaction Simulation (Premium)
```
POST /api/simulate                 # Simulate transaction for MEV risk
GET /api/simulate/:id              # Get simulation results
```

### Flashbots Private Relay (Premium)
```
POST /api/protected-relay          # Send private transaction via Flashbots
```

### User & Payment
```
GET /api/user/:address             # Get user profile
GET /api/payment/features          # Get premium features pricing
POST /api/payment/process          # Process ETH payment
```

## 🧠 MEV Detection Algorithm

The detector uses multiple indicators:

1. **High Gas Price**: Transaction with >50% above network average
2. **Large Value Transfer**: Significant ETH to known DEX routers
3. **Target Router Detection**: Known Uniswap/1Inch router addresses
4. **Sequential Attack Pattern**: Multiple transactions to same pool within 5s
5. **Risk Score Calculation**:
   ```
   Score = 20% (is_swap) + 15% (known_router) + 30% (large_value) + 25% (high_gas) + 10% (multiple_indicators)
   ```

6. **Confidence Threshold**: Only report attacks with >70% confidence

## 💳 Payment System

### Premium Features
- **Transaction Simulation**: 0.001 ETH (1 day access)
- **Advanced Protection**: 0.001 ETH (7 days access)  
- **Historical Analytics**: 0.005 ETH (30 days access)

### Payment Flow
1. User clicks "Upgrade to Premium"
2. MetaMask sends ETH transaction
3. Backend verifies transaction on-chain
4. Premium access granted for duration
5. User profile updated with expiry date

## 🔒 Security Considerations

### Production Checklist
- [ ] Use environment secrets for private keys (never in code)
- [ ] Implement rate limiting on API endpoints
- [ ] Add authentication for payment endpoints
- [ ] Use HTTPS/WSS for production
- [ ] Validate all user inputs
- [ ] Audit smart contract interactions
- [ ] Implement database for persistence (vs. in-memory)
- [ ] Add logging and monitoring
- [ ] Implement CORS properly for production domain

### Flashbots Security
- Private transactions are encrypted before relay
- Sensitive data never exposed to MEV bots
- Use Flashbots Protect for maximum privacy
- Only works with Ethereum mainnet (for now)

## 📊 Real-World Usage Example

### Scenario: Uniswap Swap Protection

1. **User wants to swap 100 USDC for ETH**
   ```
   Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564 (Uniswap V3)
   Value: 100 USDC
   Slippage: 1%
   ```

2. **Simulator Analysis**
   - Detects multiple similar swaps in mempool
   - High gas prices from other transactions
   - Risk Score: 78% (HIGH)
   - Potential slippage: 0.8 ETH

3. **Recommendations**
   - Use Flashbots Protect (included)
   - Split into 2 swaps instead of 1
   - Wait for lower gas prices

4. **User Action**
   - Clicks "Use Flashbots Protect"
   - Transaction sent privately
   - No MEV bots can see it
   - Executes safely on-chain

## 🔧 Configuration

### MEV Detection Settings (server/src/config.ts)

```typescript
mempoolPollInterval: 2000              // Scan every 2 seconds
attackDetectionTimeWindow: 60000       // 1 minute window for patterns
gasMultiplierThreshold: 1.5            // Alert if gas > 50% above base
largeSwapThreshold: '1000'             // 1000 ETH equivalent
minConfidenceScore: 70                 // Only report 70%+ confidence
```

### Known MEV Routers
```typescript
knownRouters: [
  '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
  '0x68b3465833fb72B5A828cCEBEA94Ba3A27C5fA40', // SwapRouter02
  '0x1111111254fb6c44bac0bed2854e76f90643097d', // 1Inch v3
  '0x881d40237659c877a36f69b6b2edc16ecb4c37df', // 1Inch v4
]
```

## 📈 Monitoring Dashboard Metrics

- **Total Attacks Detected**: Cumulative count
- **Average Risk Score**: Across all detected attacks
- **Total Slippage Loss**: Sum of all calculated slippage
- **Premium Users**: Active subscription count
- **Attack Distribution**: Pie chart by attack type
- **Attacks Over Time**: Line chart of hourly detections
- **Recent Attacks**: Live feed of latest detections

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Vercel/Netlify (Frontend)
```bash
npm run build
# Upload dist folder to Vercel
```

### Heroku (Backend)
```bash
heroku login
heroku create mev-detector-api
git push heroku main
```

## 📝 Future Enhancements

- [ ] **L2 Support**: Arbitrum, Optimism, Polygon detection
- [ ] **Batch Protection**: Multi-transaction bundles via Flashbots
- [ ] **Smart Routing**: AI-suggested DEX routes
- [ ] **Historical Data**: Indexed attack database
- [ ] **API Keys**: For third-party integrations
- [ ] **Mobile App**: iOS/Android version
- [ ] **NFT Gating**: NFT-based premium access
- [ ] **DAO Governance**: Community-driven features

## 🤝 Contributing

Contributions welcome! Please follow:
1. Fork repository
2. Create feature branch
3. Submit pull request with tests
4. Follow existing code style

## 📄 License

MIT License - See LICENSE.md

## ⚠️ Disclaimer

This software is provided "as-is" without warranty. Using this tool does not guarantee protection from MEV attacks. Always conduct thorough testing before using on mainnet. The authors assume no liability for financial losses incurred through use of this software.

## 📞 Support

- **Issues**: GitHub Issues
- **Discussion**: GitHub Discussions
- **Twitter**: @MEVDetector

## 🙏 Acknowledgments

- [Alchemy](https://www.alchemy.com/) - Mempool API
- [Flashbots](https://www.flashbots.net/) - Private transaction relay
- [OpenZeppelin](https://www.openzeppelin.com/) - Security best practices
- [Ethereum Foundation](https://ethereum.org/) - Technical resources

---

**Built with ❤️ for Ethereum traders**

Stay safe. Protect your swaps. 🛡️✨#   m e v - d e t e c t o r  
 #   f r o n t - r u n n i n g - m e v  
 