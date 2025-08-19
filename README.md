# Min4337 - 最精简的ERC-4337实现

这是一个最精简的ERC-4337账户抽象转账功能实现，包含合约工厂和TypeScript客户端。

## 🏗️ 项目结构

```
Min4337/
├── contracts/          # Foundry智能合约项目
│   ├── src/
│   │   ├── SimpleAccount.sol          # 简单账户合约
│   │   └── SimpleAccountFactory.sol   # 账户工厂合约
│   └── script/Deploy.s.sol           # 部署脚本
├── src/                # TypeScript客户端
│   ├── types.ts        # 类型定义
│   ├── config.ts       # 配置管理
│   ├── account.ts      # 账户抽象逻辑
│   ├── bundler.ts      # Bundler交互
│   ├── transfer.ts     # 转账功能
│   └── index.ts        # 演示脚本
└── .env               # 环境配置
```

## 🔧 配置说明

环境变量配置在 `.env` 文件中：

```bash
ETH_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETH_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
BUNDLER_RPC_URL=https://api.pimlico.io/v2/11155111/rpc?apikey=YOUR_API_KEY
ACCOUNT_FACTORY_ADDRESS=0x63A302567C6Ed077cbc9ce7337e5391e04125B0c
ENTRY_POINT_ADDRESS=0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
ETHERSCAN_API=YOUR_ETHERSCAN_API_KEY
```

## 🚀 部署的合约

- **SimpleAccountFactory**: \`0x63A302567C6Ed077cbc9ce7337e5391e04125B0c\`
- **EntryPoint**: \`0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789\` (标准EntryPoint)

## 📝 使用步骤

### 1. 初始化并查看账户信息
\`\`\`bash
npm run start
\`\`\`

### 2. 向账户转入ETH
获取到的账户地址需要先转入一些ETH用于支付gas费用。

### 3. 执行ERC-4337转账
\`\`\`bash
npm run transfer
\`\`\`

## 🔑 关键特性

- ✅ **固定Salt**: 使用固定salt值(123456)确保多次调试使用同一地址
- ✅ **最精简实现**: 去除不必要的功能，专注核心转账功能
- ✅ **Sepolia部署**: 合约已部署到Sepolia测试网
- ✅ **完整流程**: 从UserOperation创建到Bundler提交的完整流程

## 📋 转账流程

1. 创建或获取已存在的智能合约账户地址
2. 构建转账的callData (调用账户的execute函数)
3. 创建UserOperation包含所有必要字段
4. 对UserOperation进行签名
5. 通过Bundler提交到EntryPoint
6. 等待交易确认

## 🛠️ 技术栈

- **合约**: Solidity + Foundry + OpenZeppelin
- **客户端**: TypeScript + Ethers.js
- **网络**: Sepolia测试网
- **Bundler**: Pimlico

## ⚠️ 注意事项

- 确保账户有足够ETH支付gas费用
- 使用固定salt便于调试，生产环境建议使用随机salt
- Bundler服务需要有效的API key