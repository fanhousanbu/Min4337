import { ethers } from 'ethers';
import { AccountAbstraction } from './account';
import { Bundler } from './bundler';
import { appConfig } from './config';

// Enhanced account with custom validator addresses
const ENHANCED_FACTORY_ADDRESS = "0x22403667e5511eed545396d22655C89e53e67529";
const ECDSA_VALIDATOR_ADDRESS = "0x08922A87fAd7E85F75095c583B56cee011949F13";
const TEST_ACCOUNT_ADDRESS = "0x4CEA9441c171F822A0D115Ffd0198D47687d6e4C";
const STANDARD_ACCOUNT_ADDRESS = "0x5e776cA395caF59f86dA0b0c6b00573Ae105c2aA";

// Test salt used in deployment
const TEST_SALT = "12345";

async function testEnhancedAccount() {
  try {
    console.log('🔧 测试增强版ERC-4337账户...');
    console.log('=====================================');

    const provider = new ethers.JsonRpcProvider(appConfig.rpcUrl);
    const owner = new ethers.Wallet(appConfig.privateKey, provider);

    // Test 1: Check enhanced factory deployment
    console.log('\n📋 1. 验证增强工厂部署');
    const factoryAbi = [
      "function getImplementation() view returns (address)",
      "function getAddress(address owner, address signatureValidator, bool useCustomValidator, uint256 salt) view returns (address)",
      "function accountImplementation() view returns (address)"
    ];
    
    const enhancedFactory = new ethers.Contract(
      ENHANCED_FACTORY_ADDRESS,
      factoryAbi,
      provider
    );

    const implementation = await enhancedFactory.getImplementation();
    console.log(`✅ 实现合约地址: ${implementation}`);

    // Test 2: Verify test account address matches expected
    console.log('\n📋 2. 验证测试账户地址');
    const expectedAddress = await enhancedFactory['getAddress(address,address,bool,uint256)'](
      owner.address,
      ECDSA_VALIDATOR_ADDRESS,
      true,
      TEST_SALT
    );
    
    console.log(`🔍 期望地址: ${expectedAddress}`);
    console.log(`🔍 实际地址: ${TEST_ACCOUNT_ADDRESS}`);
    console.log(`✅ 地址匹配: ${expectedAddress.toLowerCase() === TEST_ACCOUNT_ADDRESS.toLowerCase()}`);

    // Test 3: Check account configuration
    console.log('\n📋 3. 检查账户配置');
    const accountAbi = [
      "function getValidationConfig() view returns (address validator, bool isCustom, address accountOwner)",
      "function owner() view returns (address)",
      "function signatureValidator() view returns (address)",
      "function useCustomValidator() view returns (bool)"
    ];

    const testAccount = new ethers.Contract(TEST_ACCOUNT_ADDRESS, accountAbi, provider);
    
    try {
      const config = await testAccount.getValidationConfig();
      console.log(`✅ 验签器地址: ${config.validator}`);
      console.log(`✅ 使用自定义验签: ${config.isCustom}`);
      console.log(`✅ 账户拥有者: ${config.accountOwner}`);
    } catch (error) {
      console.log('⚠️  无法获取验证配置，可能账户未部署');
    }

    // Test 4: Check ECDSA validator
    console.log('\n📋 4. 检查ECDSA验证器');
    const validatorAbi = [
      "function owner() view returns (address)",
      "function replayProtectionEnabled() view returns (bool)",
      "function validateSignatureView(bytes32 hash, address signer, bytes signature) view returns (bool)"
    ];

    const ecdsaValidator = new ethers.Contract(ECDSA_VALIDATOR_ADDRESS, validatorAbi, provider);
    const validatorOwner = await ecdsaValidator.owner();
    const replayProtection = await ecdsaValidator.replayProtectionEnabled();
    
    console.log(`✅ 验证器拥有者: ${validatorOwner}`);
    console.log(`✅ 重放保护: ${replayProtection}`);

    // Test 5: Test signature validation
    console.log('\n📋 5. 测试签名验证');
    const testHash = ethers.keccak256(ethers.toUtf8Bytes("test message"));
    const ethSignedHash = ethers.hashMessage(ethers.getBytes(testHash));
    const signature = await owner.signMessage(ethers.getBytes(testHash));
    
    const isValid = await ecdsaValidator.validateSignatureView(
      ethSignedHash,
      owner.address,
      signature
    );
    
    console.log(`✅ 签名验证结果: ${isValid}`);

    // Test 6: Check account balances
    console.log('\n📋 6. 检查账户余额');
    const testAccountBalance = await provider.getBalance(TEST_ACCOUNT_ADDRESS);
    const standardAccountBalance = await provider.getBalance(STANDARD_ACCOUNT_ADDRESS);
    
    console.log(`💰 测试账户余额: ${ethers.formatEther(testAccountBalance)} ETH`);
    console.log(`💰 标准账户余额: ${ethers.formatEther(standardAccountBalance)} ETH`);

    console.log('\n🎉 增强版账户验证完成！');
    console.log('\n💡 功能特性:');
    console.log('- ✅ 支持自定义签名验证器');
    console.log('- ✅ 可插拔的验证逻辑');
    console.log('- ✅ 向后兼容标准ECDSA');
    console.log('- ✅ 支持多签等复杂验证场景');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testEnhancedAccount().catch(console.error);