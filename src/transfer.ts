import { ethers } from 'ethers';
import { AccountAbstraction } from './account';
import { Bundler } from './bundler';

async function main() {
  try {
    console.log('🚀 开始ERC-4337转账...');

    const account = new AccountAbstraction();
    const bundler = new Bundler();

    // 获取账户地址
    const accountAddress = await account.getAccountAddress();
    console.log(`📝 Account Address: ${accountAddress}`);

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

    // 创建UserOperation
    console.log('📋 创建UserOperation...');
    const userOp = await account.createUserOperation(
      recipientAddress,
      transferAmount
    );

    console.log('✅ UserOperation创建成功:', {
      sender: userOp.sender,
      nonce: userOp.nonce,
      callData: userOp.callData.slice(0, 20) + '...',
      signature: userOp.signature.slice(0, 20) + '...'
    });

    // 发送到Bundler
    console.log('📡 发送UserOperation到Bundler...');
    const userOpHash = await bundler.sendUserOperation(userOp);
    console.log(`✅ UserOperation已提交, Hash: ${userOpHash}`);

    // 等待确认
    console.log('⏳ 等待交易确认...');
    const receipt = await bundler.waitForUserOperationReceipt(userOpHash);
    
    if (receipt.success) {
      console.log('🎉 转账成功!');
      console.log(`📄 Transaction Hash: ${receipt.receipt.transactionHash}`);
      console.log(`🔗 查看交易: https://sepolia.etherscan.io/tx/${receipt.receipt.transactionHash}`);
    } else {
      console.log('❌ 转账失败');
      console.log('Receipt:', receipt);
    }

  } catch (error) {
    console.error('❌ 转账过程中发生错误:', error);
  }
}

main().catch(console.error);