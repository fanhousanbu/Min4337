import { AccountAbstraction } from './account';

async function main() {
  try {
    console.log('📋 ERC-4337 Account Abstraction 演示');
    console.log('=====================================');

    const account = new AccountAbstraction();

    // 获取账户地址
    const accountAddress = await account.getAccountAddress();
    console.log(`📝 Account Address: ${accountAddress}`);
    
    // 获取初始化代码
    const initCode = await account.getInitCode();
    console.log(`🔧 Init Code: ${initCode === '0x' ? '账户已部署' : '需要部署账户'}`);
    
    // 获取nonce
    const nonce = await account.getNonce(accountAddress);
    console.log(`🔢 Nonce: ${nonce}`);

    console.log('');
    console.log('✅ 系统初始化完成');
    console.log(`💡 使用固定salt: 123456`);
    console.log('💡 运行 "npm run transfer" 执行转账测试');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  }
}

main().catch(console.error);