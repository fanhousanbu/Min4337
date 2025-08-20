import { ethers } from 'ethers';
import { AccountAbstraction } from './account';
import { EnhancedAccountAbstraction } from './enhanced-account';
import { Bundler } from './bundler';

async function compareTransfers() {
  try {
    console.log('🔄 对比标准版 vs 增强版 ERC-4337转账');
    console.log('================================================');

    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);
    const bundler = new Bundler();

    // 创建两种账户实例
    const standardAccount = new AccountAbstraction();
    const enhancedAccount = new EnhancedAccountAbstraction(true);

    console.log('\n📋 1. 账户地址对比');
    console.log('================');
    
    const standardAddress = await standardAccount.getAccountAddress();
    const enhancedAddress = await enhancedAccount.getAccountAddress();
    
    console.log(`📝 标准账户地址: ${standardAddress}`);
    console.log(`📝 增强账户地址: ${enhancedAddress}`);

    // 检查余额
    console.log('\n💰 2. 账户余额检查');
    console.log('================');
    
    const standardBalance = await provider.getBalance(standardAddress);
    const enhancedBalance = await provider.getBalance(enhancedAddress);
    
    console.log(`💰 标准账户余额: ${ethers.formatEther(standardBalance)} ETH`);
    console.log(`💰 增强账户余额: ${ethers.formatEther(enhancedBalance)} ETH`);

    if (enhancedBalance === 0n) {
      console.log('⚠️  增强账户余额为0，请先向账户转入一些ETH');
      console.log(`   增强账户地址: ${enhancedAddress}`);
      return;
    }

    console.log('\n🔧 3. 验证配置对比');
    console.log('================');
    
    console.log('标准账户: 固定使用ECDSA验证');
    
    const enhancedConfig = await enhancedAccount.getValidationConfig();
    console.log(`增强账户:`);
    console.log(`   - 验证器地址: ${enhancedConfig.validator}`);
    console.log(`   - 使用自定义验证: ${enhancedConfig.isCustom}`);
    console.log(`   - 验证类型: ${enhancedConfig.isCustom ? '自定义ECDSA验证器' : '标准ECDSA'}`);

    console.log('\n🚀 4. 执行增强版转账');
    console.log('====================');

    const recipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const transferAmount = ethers.parseEther('0.0001');

    console.log(`📤 转账目标: ${recipientAddress}`);
    console.log(`💸 转账金额: ${ethers.formatEther(transferAmount)} ETH`);

    // 使用增强版账户转账
    console.log('\n📋 创建增强版UserOperation...');
    const enhancedUserOp = await enhancedAccount.createUserOperation(
      recipientAddress,
      transferAmount
    );

    console.log('✅ 增强版UserOperation创建成功');
    console.log(`   - 发送者: ${enhancedUserOp.sender}`);
    console.log(`   - 签名长度: ${enhancedUserOp.signature.length} 字符`);
    console.log(`   - 使用自定义验证: ✅ 是`);

    console.log('\n📡 发送增强版UserOperation到Bundler...');
    const userOpHash = await bundler.sendUserOperation(enhancedUserOp);
    console.log(`✅ UserOperation已提交, Hash: ${userOpHash}`);

    console.log('\n⏳ 等待交易确认...');
    const receipt = await bundler.waitForUserOperationReceipt(userOpHash);
    
    if (receipt.success) {
      console.log('🎉 增强版转账成功!');
      console.log(`📄 Transaction Hash: ${receipt.receipt.transactionHash}`);
      console.log(`🔗 查看交易: https://sepolia.etherscan.io/tx/${receipt.receipt.transactionHash}`);
      
      const finalBalance = await provider.getBalance(enhancedAddress);
      console.log(`💰 转账后余额: ${ethers.formatEther(finalBalance)} ETH`);
    }

    console.log('\n📊 5. 功能特性对比');
    console.log('================');
    
    console.log('标准版本:');
    console.log('- ✅ 基础ERC-4337转账');
    console.log('- ✅ 固定ECDSA验证');
    console.log('- ✅ 简单高效');
    
    console.log('\n增强版本:');
    console.log('- ✅ 完整ERC-4337转账');
    console.log('- ✅ 可插拔验证器');
    console.log('- ✅ 支持自定义验证逻辑');
    console.log('- ✅ 支持多签、时间锁等复杂场景');
    console.log('- ✅ 运行时可切换验证模式');
    console.log('- ✅ 向后兼容标准版本');

  } catch (error) {
    console.error('❌ 对比测试过程中发生错误:', error);
  }
}

compareTransfers().catch(console.error);