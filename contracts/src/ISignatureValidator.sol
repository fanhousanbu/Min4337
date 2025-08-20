// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

/**
 * @title ISignatureValidator
 * @dev Interface for custom signature validation contracts
 */
interface ISignatureValidator {
    /**
     * @dev Validates a signature for a given hash and signer
     * @param hash The hash that was signed
     * @param signer The expected signer address
     * @param signature The signature to validate
     * @return valid True if signature is valid, false otherwise
     */
    function validateSignature(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external returns (bool valid);
}