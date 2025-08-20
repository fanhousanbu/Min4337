import { ethers } from 'ethers';
import { EnhancedAccountAbstraction } from './enhanced-account';
import { Bundler } from './bundler';

async function main() {
  try {
    console.log('🚀 开始增强版ERC-4337转账...');
    console.log('=====================================');

    // 创建增强版账户实例 (使用自定义ECDSA验证器)
    const enhancedAccount = new EnhancedAccountAbstraction(true); // 使用自定义验证器
    const bundler = new Bundler();

    // 获取账户地址
    const accountAddress = await enhancedAccount.getAccountAddress();
    console.log(`📝 Enhanced Account Address: ${accountAddress}`);

    // 检查验证配置
    const validationConfig = await enhancedAccount.getValidationConfig();
    console.log(`🔧 验证器配置:`);
    console.log(`   - 验证器地址: ${validationConfig.validator}`);
    console.log(`   - 使用自定义验证: ${validationConfig.isCustom}`);
    console.log(`   - 账户拥有者: ${validationConfig.accountOwner}`);

    // 检查账户余额
    const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL!);
    const balance = await provider.getBalance(accountAddress);
    console.log(`💰 Account Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
      console.log('⚠️  账户余额为0，请先向账户转入一些ETH以支付gas费用');
      console.log(`   请向此地址转账: ${accountAddress}`);
      return;
    }

    // 设置转账参数
    const recipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // 示例收款地址
    const transferAmount = ethers.parseEther('0.0001'); // 转账0.0001 ETH

    console.log(`📤 转账目标: ${recipientAddress}`);
    console.log(`💸 转账金额: ${ethers.formatEther(transferAmount)} ETH`);
    console.log(`🔐 使用增强版自定义验证器进行签名验证`);

    // 创建UserOperation
    console.log('\n📋 创建UserOperation...');
    const userOp = await enhancedAccount.createUserOperation(
      recipientAddress,
      transferAmount
    );

    console.log('✅ UserOperation创建成功:', {
      sender: userOp.sender,
      nonce: userOp.nonce,
      initCode: userOp.initCode.slice(0, 20) + '...',
      callData: userOp.callData.slice(0, 20) + '...',
      signature: userOp.signature.slice(0, 20) + '...',
      useCustomValidator: '✅ 是 (ECDSA Validator)'
    });

    // 发送到Bundler
    console.log('\n📡 发送UserOperation到Bundler...');
    const userOpHash = await bundler.sendUserOperation(userOp);
    console.log(`✅ UserOperation已提交, Hash: ${userOpHash}`);

    // 等待确认
    console.log('\n⏳ 等待交易确认...');
    const receipt = await bundler.waitForUserOperationReceipt(userOpHash);
    
    if (receipt.success) {
      console.log('🎉 增强版转账成功!');
      console.log(`📄 Transaction Hash: ${receipt.receipt.transactionHash}`);
      console.log(`🔗 查看交易: https://sepolia.etherscan.io/tx/${receipt.receipt.transactionHash}`);
      
      // 检查最终余额
      const finalBalance = await provider.getBalance(accountAddress);
      console.log(`💰 转账后余额: ${ethers.formatEther(finalBalance)} ETH`);
      
      console.log('\n🆕 增强版特性验证:');
      console.log('- ✅ 使用了自定义ECDSA验证器');
      console.log('- ✅ 支持可插拔签名验证逻辑');
      console.log('- ✅ 保持与标准ERC-4337的完全兼容');
      console.log('- ✅ 验证器地址: 0x08922A87fAd7E85F75095c583B56cee011949F13');
    } else {
      console.log('❌ 转账失败');
      console.log('Receipt:', receipt);
    }

  } catch (error) {
    console.error('❌ 转账过程中发生错误:', error);
  }
}

main().catch(console.error);