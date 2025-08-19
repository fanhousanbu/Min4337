import { ethers } from 'ethers';
import { UserOperation } from './types';
import { appConfig } from './config';

// 固定salt便于调试
const SALT = "123456";

export class AccountAbstraction {
  private provider: ethers.JsonRpcProvider;
  private owner: ethers.Wallet;
  private factoryContract: ethers.Contract;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(appConfig.rpcUrl);
    this.owner = new ethers.Wallet(appConfig.privateKey, this.provider);
    
    const factoryAbi = [
      "function createAccount(address owner, uint256 salt) returns (address)",
      "function getAddress(address owner, uint256 salt) view returns (address)"
    ];
    
    this.factoryContract = new ethers.Contract(
      appConfig.factoryAddress,
      factoryAbi,
      this.provider
    );
  }

  async getAccountAddress(): Promise<string> {
    return await this.factoryContract['getAddress(address,uint256)'](this.owner.address, SALT);
  }

  async getInitCode(): Promise<string> {
    const accountAddress = await this.getAccountAddress();
    const code = await this.provider.getCode(accountAddress);
    
    if (code !== '0x') {
      return '0x';
    }
    
    return ethers.concat([
      appConfig.factoryAddress,
      this.factoryContract.interface.encodeFunctionData("createAccount", [
        this.owner.address,
        SALT
      ])
    ]);
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
}