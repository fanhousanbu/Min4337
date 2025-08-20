# Min4337 - Minimal ERC-4337 Implementation with Enhanced Signature Validation

A minimal ERC-4337 Account Abstraction implementation featuring pluggable signature validators and on-chain signature verification.

## 🎯 Features

- ✅ **Enhanced Validation** - Pluggable signature validators with on-chain verification
- ✅ **Custom Validators** - Support for ECDSA, Multi-sig, and custom validation logic
- ✅ **Fixed Salt** - Deterministic addresses for consistent debugging
- ✅ **Complete ERC-4337 Flow** - From UserOperation creation to bundler submission
- ✅ **v0.6 Compatible** - Compatible with mainstream bundler services
- ✅ **Deployed & Verified** - Contracts deployed and verified on Sepolia testnet
- ✅ **Backward Compatible** - Fully compatible with standard ECDSA validation

## 🏗️ Project Structure

```
Min4337/
├── .env                                    # Environment configuration
├── package.json                           # Node.js project config
├── tsconfig.json                          # TypeScript config
├── README.md                              # Project documentation
├── contracts/                             # Foundry smart contract project
│   ├── foundry.toml                       # Foundry configuration
│   ├── lib/                               # Contract dependencies (git submodules)
│   ├── src/
│   │   ├── SimpleAccountV6Enhanced.sol         # Enhanced ERC-4337 account
│   │   ├── SimpleAccountFactoryV6Enhanced.sol  # Enhanced account factory
│   │   ├── ISignatureValidator.sol             # Validator interface
│   │   ├── ECDSAValidator.sol                  # Enhanced ECDSA validator
│   │   └── MultiSigValidator.sol               # Multi-signature validator
│   └── script/
│       └── DeployEnhanced.s.sol          # Enhanced deployment script
└── src/                                   # TypeScript client
    ├── types.ts                          # Type definitions
    ├── config.ts                         # Configuration management
    ├── bundler.ts                        # Bundler interaction
    ├── enhanced-account.ts               # Enhanced account abstraction logic
    └── enhanced-transfer-with-payment.ts # Complete transfer demonstration
```

## 🔧 Environment Setup

Configure environment variables in `.env` file:

```env
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BUNDLER_RPC_URL=https://api.pimlico.io/v2/11155111/rpc?apikey=YOUR_API_KEY
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
ETHERSCAN_API=YOUR_ETHERSCAN_API_KEY
```

## 📝 Deployed Contracts

**Sepolia Testnet:**

**Enhanced Version (Custom Signature Validation):**
- **SimpleAccountFactoryV6Enhanced**: `0x22403667e5511eed545396d22655C89e53e67529`
- **SimpleAccountV6Enhanced** (Implementation): `0xFCc53A1422f949519A59c8767e89A12BFc607C21`
- **ECDSAValidator**: `0x08922A87fAd7E85F75095c583B56cee011949F13`
- **MultiSigValidator**: `0xA89922f2bd31Df760006D3B273535D662eCa1D9c`

**Standard:**
- **EntryPoint**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (Official v0.6)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Fund Your Account
The enhanced account will use a deterministic address. Fund it with some ETH for gas fees (recommended 0.005 ETH or more).

### 3. Run Enhanced Transfer Demo
```bash
npm run enhanced-transfer
```
This demonstrates the complete enhanced ERC-4337 transfer flow with custom signature validation.

### 4. Compile TypeScript (Optional)
```bash
npm run build
```

## 💡 Core Workflow

1. **Enhanced Account Creation** - Deploy account with pluggable signature validator
2. **Custom Validation Setup** - Configure on-chain signature validation contract
3. **UserOperation Construction** - Build UserOperation with enhanced validation data
4. **On-chain Signature Verification** - Validator contract verifies signatures
5. **Bundler Submission** - Submit through Pimlico bundler to EntryPoint
6. **Transaction Execution** - EntryPoint validates and executes the transfer

## 🔑 Technical Highlights

### Enhanced Signature Validation
- **Pluggable Validators**: Support for custom validation logic via interface contracts
- **On-chain Verification**: Signature validation performed by deployed contracts
- **Multiple Validators**: ECDSA, Multi-sig, and extensible custom validators
- **Fallback Mechanism**: Graceful fallback to standard ECDSA if custom validator fails

### Smart Contract Features
- **ISignatureValidator Interface**: Standard interface for all validation contracts
- **ECDSAValidator Contract**: Enhanced ECDSA validation with replay protection
- **MultiSigValidator Contract**: Multi-signature validation implementation
- **Event Logging**: Comprehensive events for validation tracking and debugging

### Client Features
- **EnhancedAccountAbstraction Class**: Full-featured account management
- **Validator Configuration**: Runtime validator switching and configuration
- **Fixed Salt**: Uses `12345` as fixed salt for deterministic addresses
- **v0.6 Compatibility**: Full compatibility with ERC-4337 v0.6 specification

## 📋 Demo Output Example

```
🚀 开始增强版ERC-4337转账...
=====================================
📝 Enhanced Account Address: 0xab0b3c149FdF643A96b535ee60b43639F83A1B57
🔧 验证器配置:
   - 验证器地址: 0x08922A87fAd7E85F75095c583B56cee011949F13
   - 使用自定义验证: true
   - 账户拥有者: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Account Balance: 0.05 ETH
📤 转账目标: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
💸 转账金额: 0.0001 ETH
🔐 使用增强版自定义验证器进行签名验证

📋 创建UserOperation...
✅ UserOperation创建成功
📡 发送UserOperation到Bundler...
✅ UserOperation已提交, Hash: 0xa76917...
⏳ 等待交易确认...
🎉 增强版转账成功!
📄 Transaction Hash: 0x4549fa...
🔗 查看交易: https://sepolia.etherscan.io/tx/0x4549fa...

🆕 增强版特性验证:
- ✅ 使用了自定义ECDSA验证器
- ✅ 支持可插拔签名验证逻辑
- ✅ 保持与标准ERC-4337的完全兼容
- ✅ 验证器地址: 0x08922A87fAd7E85F75095c583B56cee011949F13
```

## 🛠️ Technology Stack

- **Smart Contracts**: Solidity + Foundry + OpenZeppelin
- **Client**: TypeScript + Ethers.js v6
- **Network**: Sepolia Testnet
- **Bundler**: Pimlico
- **Standard**: ERC-4337 Account Abstraction v0.6
- **Validation**: Custom on-chain signature validators

## ⚠️ Important Notes

- Ensure the smart account has sufficient ETH for gas fees
- Fixed salt is used for debugging; use random salt in production
- Bundler service requires a valid API key
- Custom validators can be extended for complex validation scenarios
- All private keys should be kept secure and never committed to version control

## 🔧 Contract Development

### Building Contracts
```bash
cd contracts
forge build
```

### Testing Contracts
```bash
cd contracts
forge test
```

### Deploying New Contracts
```bash
cd contracts
forge script script/DeployEnhanced.s.sol --rpc-url sepolia --broadcast --verify
```

## 📖 Related Resources

- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction Documentation](https://www.erc4337.io/)
- [Pimlico Bundler](https://docs.pimlico.io/)
- [Foundry Toolkit](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)