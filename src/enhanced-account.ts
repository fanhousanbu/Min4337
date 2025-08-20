import { ethers } from 'ethers';
import { UserOperation } from './types';
import { appConfig } from './config';

// 增强版合约地址
const ENHANCED_FACTORY_ADDRESS = "0x22403667e5511eed545396d22655C89e53e67529";
const ECDSA_VALIDATOR_ADDRESS = "0x08922A87fAd7E85F75095c583B56cee011949F13";

// 固定salt便于调试
const SALT = "12345";

export class EnhancedAccountAbstraction {
  private provider: ethers.JsonRpcProvider;
  private owner: ethers.Wallet;
  private factoryContract: ethers.Contract;
  private useCustomValidator: boolean;
  private validatorAddress: string;
  
  constructor(useCustomValidator: boolean = true, validatorAddress: string = ECDSA_VALIDATOR_ADDRESS) {
    this.provider = new ethers.JsonRpcProvider(appConfig.rpcUrl);
    this.owner = new ethers.Wallet(appConfig.privateKey, this.provider);
    this.useCustomValidator = useCustomValidator;
    this.validatorAddress = validatorAddress;
    
    const factoryAbi = [
      "function createAccount(address owner, uint256 salt) returns (address)",
      "function createAccountWithValidator(address owner, address signatureValidator, bool useCustomValidator, uint256 salt) returns (address)",
      "function getAddress(address owner, uint256 salt) view returns (address)",
      "function getAddress(address owner, address signatureValidator, bool useCustomValidator, uint256 salt) view returns (address)"
    ];
    
    this.factoryContract = new ethers.Contract(
      ENHANCED_FACTORY_ADDRESS,
      factoryAbi,
      this.provider
    );
  }

  async getAccountAddress(): Promise<string> {
    if (this.useCustomValidator) {
      return await this.factoryContract['getAddress(address,address,bool,uint256)'](
        this.owner.address, 
        this.validatorAddress,
        this.useCustomValidator,
        SALT
      );
    } else {
      return await this.factoryContract['getAddress(address,uint256)'](this.owner.address, SALT);
    }
  }

  async getInitCode(): Promise<string> {
    const accountAddress = await this.getAccountAddress();
    const code = await this.provider.getCode(accountAddress);
    
    if (code !== '0x') {
      return '0x';
    }
    
    if (this.useCustomValidator) {
      return ethers.concat([
        ENHANCED_FACTORY_ADDRESS,
        this.factoryContract.interface.encodeFunctionData("createAccountWithValidator", [
          this.owner.address,
          this.validatorAddress,
          this.useCustomValidator,
          SALT
        ])
      ]);
    } else {
      return ethers.concat([
        ENHANCED_FACTORY_ADDRESS,
        this.factoryContract.interface.encodeFunctionData("createAccount", [
          this.owner.address,
          SALT
        ])
      ]);
    }
  }

  async getNonce(accountAddress: string): Promise<bigint> {
    const entryPointAbi = [
      "function getNonce(address, uint192) view returns (uint256)"
    ];
    
    const entryPoint = new ethers.Contract(
      appConfig.entryPointAddress,
      entryPointAbi,
      this.provider
    );
    
    return await entryPoint.getNonce(accountAddress, 0);
  }

  encodeExecuteCall(target: string, value: bigint, data: string): string {
    const executeAbi = ["function execute(address,uint256,bytes)"];
    const iface = new ethers.Interface(executeAbi);
    return iface.encodeFunctionData("execute", [target, value, data]);
  }

  async createUserOperation(
    target: string,
    value: bigint,
    data: string = '0x'
  ): Promise<UserOperation> {
    const accountAddress = await this.getAccountAddress();
    const initCode = await this.getInitCode();
    const nonce = await this.getNonce(accountAddress);
    
    const callData = this.encodeExecuteCall(target, value, data);
    
    const feeData = await this.provider.getFeeData();
    
    const userOp: UserOperation = {
      sender: accountAddress,
      nonce: "0x" + nonce.toString(16),
      initCode,
      callData,
      callGasLimit: "0x55555",
      verificationGasLimit: "0x55555", 
      preVerificationGas: "0x55555",
      maxFeePerGas: "0x" + (feeData.maxFeePerGas?.toString(16) || "0"),
      maxPriorityFeePerGas: "0x" + (feeData.maxPriorityFeePerGas?.toString(16) || "0"),
      paymasterAndData: "0x",
      signature: "0x"
    };

    const userOpHash = await this.getUserOpHash(userOp);
    userOp.signature = await this.signUserOp(userOpHash);
    
    return userOp;
  }

  private async getUserOpHash(userOp: UserOperation): Promise<string> {
    const chainId = (await this.provider.getNetwork()).chainId;
    
    const packedUserOp = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32", "bytes32", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32"],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.initCode),
        ethers.keccak256(userOp.callData),
        userOp.callGasLimit,
        userOp.verificationGasLimit,
        userOp.preVerificationGas,
        userOp.maxFeePerGas,
        userOp.maxPriorityFeePerGas,
        ethers.keccak256(userOp.paymasterAndData)
      ]
    );
    
    return ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes32", "address", "uint256"],
        [ethers.keccak256(packedUserOp), appConfig.entryPointAddress, chainId]
      )
    );
  }

  private async signUserOp(userOpHash: string): Promise<string> {
    return await this.owner.signMessage(ethers.getBytes(userOpHash));
  }

  /**
   * 获取账户的验证配置
   */
  async getValidationConfig(): Promise<{validator: string, isCustom: boolean, accountOwner: string}> {
    const accountAddress = await this.getAccountAddress();
    const accountAbi = [
      "function getValidationConfig() view returns (address validator, bool isCustom, address accountOwner)"
    ];

    try {
      const account = new ethers.Contract(accountAddress, accountAbi, this.provider);
      const config = await account.getValidationConfig();
      return {
        validator: config.validator,
        isCustom: config.isCustom,
        accountOwner: config.accountOwner
      };
    } catch (error) {
      // 如果账户还未部署，返回预期配置
      return {
        validator: this.useCustomValidator ? this.validatorAddress : ethers.ZeroAddress,
        isCustom: this.useCustomValidator,
        accountOwner: this.owner.address
      };
    }
  }

  /**
   * 切换验证模式（仅在账户已部署且为owner时可用）
   */
  async setValidationMode(validatorAddress: string, useCustomValidator: boolean): Promise<void> {
    const accountAddress = await this.getAccountAddress();
    const accountAbi = [
      "function setSignatureValidator(address _signatureValidator, bool _useCustomValidator)"
    ];
    
    const account = new ethers.Contract(accountAddress, accountAbi, this.owner);
    const tx = await account.setSignatureValidator(validatorAddress, useCustomValidator);
    await tx.wait();
    
    // 更新本地配置
    this.validatorAddress = validatorAddress;
    this.useCustomValidator = useCustomValidator;
  }
}