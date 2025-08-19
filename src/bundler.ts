import { UserOperation } from './types';
import { appConfig } from './config';

export class Bundler {
  private bundlerUrl: string;

  constructor() {
    this.bundlerUrl = appConfig.bundlerUrl;
  }

  async sendUserOperation(userOp: UserOperation): Promise<string> {
    const response = await fetch(this.bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendUserOperation',
        params: [this.formatUserOperation(userOp), appConfig.entryPointAddress],
        id: 1,
      }),
    });

    const result: any = await response.json();
    
    if (result.error) {
      throw new Error(`Bundler error: ${result.error.message}`);
    }

    return result.result;
  }

  async getUserOperationReceipt(userOpHash: string): Promise<any> {
    const response = await fetch(this.bundlerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getUserOperationReceipt',
        params: [userOpHash],
        id: 1,
      }),
    });

    const result: any = await response.json();
    return result.result;
  }

  async waitForUserOperationReceipt(
    userOpHash: string,
    timeout: number = 60000
  ): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const receipt = await this.getUserOperationReceipt(userOpHash);
        if (receipt) {
          return receipt;
        }
      } catch (error) {
        // 继续等待
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error(`Timeout waiting for user operation receipt: ${userOpHash}`);
  }

  private formatUserOperation(userOp: UserOperation): any {
    return {
      sender: userOp.sender,
      nonce: userOp.nonce,
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: userOp.callGasLimit,
      verificationGasLimit: userOp.verificationGasLimit,
      preVerificationGas: userOp.preVerificationGas,
      maxFeePerGas: userOp.maxFeePerGas,
      maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature,
    };
  }
}