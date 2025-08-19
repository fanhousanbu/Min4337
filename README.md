# Min4337 - 最精简的ERC-4337转账实现

这是一个最精简的ERC-4337账户抽象转账功能实现，包含智能合约和TypeScript客户端。

## 🎯 特性

- ✅ **最精简实现** - 专注核心转账功能，去除不必要的复杂性
- ✅ **固定Salt** - 使用固定salt值便于调试和测试
- ✅ **完整流程** - 从UserOperation创建到Bundler提交的完整ERC-4337流程
- ✅ **v0.6兼容** - 与主流Bundler服务兼容
- ✅ **已部署验证** - 合约已部署并验证到Sepolia测试网

## 🏗️ 项目结构

```
Min4337/
├── .env                           # 环境配置
├── package.json                   # Node.js项目配置
├── tsconfig.json                  # TypeScript配置
├── README.md                      # 项目文档
├── contracts/                     # Foundry智能合约项目
│   ├── foundry.toml              # Foundry配置
│   ├── lib/                      # 合约依赖
│   ├── src/
│   │   ├── SimpleAccountV6.sol          # ERC-4337智能账户(v0.6兼容)
│   │   └── SimpleAccountFactoryV6.sol   # 账户工厂合约
│   └── script/
│       └── DeployV6.s.sol        # 部署脚本
└── src/                          # TypeScript客户端
    ├── types.ts                  # 类型定义
    ├── config.ts                 # 配置管理
    ├── account.ts                # 账户抽象逻辑
    ├── bundler.ts                # Bundler交互
    ├── index.ts                  # 演示脚本
    └── transfer.ts               # 转账功能
```

## 🔧 环境配置

环境变量在 `.env` 文件中配置：

```env
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BUNDLER_RPC_URL=https://api.pimlico.io/v2/11155111/rpc?apikey=YOUR_API_KEY
ACCOUNT_FACTORY_ADDRESS=0xdDe3Dd4e4Bb65e877888Bbe4B4bEB82df7DA8E22
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
ETHERSCAN_API=YOUR_ETHERSCAN_API_KEY
```

## 📝 已部署合约

**Sepolia测试网:**
- **SimpleAccountFactoryV6**: `0xdDe3Dd4e4Bb65e877888Bbe4B4bEB82df7DA8E22`
- **SimpleAccountV6** (实现): `0x8886824153aD7BE6d80448A87163DB5eBfF74F2c`
- **EntryPoint**: `0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789` (官方v0.6)

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 查看账户信息
```bash
npm run start
```
这将显示智能账户地址和基本信息。

### 3. 向账户转入ETH
向显示的账户地址转入一些ETH用于支付gas费用（建议0.005 ETH以上）。

### 4. 执行转账测试
```bash
npm run transfer
```

### 5. 编译TypeScript（可选）
```bash
npm run build
```

## 💡 核心工作流程

1. **创建智能账户地址** - 使用固定salt(123456)生成确定性地址
2. **构建UserOperation** - 创建包含转账信息的UserOperation
3. **签名验证** - 使用私钥对UserOperation进行签名
4. **提交Bundler** - 通过Pimlico bundler提交到EntryPoint
5. **执行转账** - EntryPoint验证并执行转账操作

## 🔑 技术特点

- **固定Salt**: 使用`123456`作为固定salt，确保多次调试使用同一地址
- **v0.6兼容**: 完全兼容ERC-4337 v0.6规范和主流bundler服务
- **签名验证**: 支持标准的ECDSA签名验证
- **Gas优化**: 最小化gas消耗的合约设计
- **错误处理**: 完善的错误处理和日志输出

## 📋 示例输出

```
🚀 开始ERC-4337转账...
📝 Account Address: 0xab0b3c149FdF643A96b535ee60b43639F83A1B57
💰 Account Balance: 0.05 ETH
📤 转账目标: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
💸 转账金额: 0.0001 ETH
📋 创建UserOperation...
✅ UserOperation创建成功
📡 发送UserOperation到Bundler...
✅ UserOperation已提交, Hash: 0xa76917...
⏳ 等待交易确认...
🎉 转账成功!
📄 Transaction Hash: 0x4549fa...
🔗 查看交易: https://sepolia.etherscan.io/tx/0x4549fa...
```

## 🛠️ 技术栈

- **智能合约**: Solidity + Foundry + OpenZeppelin
- **客户端**: TypeScript + Ethers.js v6
- **网络**: Sepolia测试网
- **Bundler**: Pimlico
- **标准**: ERC-4337 Account Abstraction v0.6

## ⚠️ 注意事项

- 确保智能账户有足够ETH支付gas费用
- 固定salt便于调试，生产环境建议使用随机salt
- Bundler服务需要有效的API key
- 转账目标地址在代码中硬编码，可根据需要修改

## 📖 相关资源

- [ERC-4337 规范](https://eips.ethereum.org/EIPS/eip-4337)
- [Account Abstraction 文档](https://www.erc4337.io/)
- [Pimlico Bundler](https://docs.pimlico.io/)
- [Foundry 工具链](https://book.getfoundry.sh/)