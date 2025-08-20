// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ISignatureValidator.sol";

/**
 * @title MultiSigValidator
 * @dev A multi-signature validator that requires multiple signatures to validate
 */
contract MultiSigValidator is ISignatureValidator {
    using ECDSA for bytes32;

    struct MultiSigConfig {
        address[] signers;
        uint256 threshold;
        bool initialized;
    }

    // Mapping from account address to its multisig configuration
    mapping(address => MultiSigConfig) public configs;
    
    // Events
    event ConfigSet(address indexed account, address[] signers, uint256 threshold);
    event SignatureValidated(address indexed account, bytes32 indexed hash, bool valid);

    /**
     * @dev Set multisig configuration for an account
     * @param account The account address
     * @param signers Array of authorized signer addresses
     * @param threshold Number of required signatures
     */
    function setConfig(
        address account,
        address[] calldata signers,
        uint256 threshold
    ) external {
        require(signers.length > 0, "MultiSigValidator: no signers");
        require(threshold > 0 && threshold <= signers.length, "MultiSigValidator: invalid threshold");
        
        // Only the account itself or uninitialized accounts can set config
        require(
            msg.sender == account || !configs[account].initialized,
            "MultiSigValidator: unauthorized"
        );

        configs[account].signers = signers;
        configs[account].threshold = threshold;
        configs[account].initialized = true;

        emit ConfigSet(account, signers, threshold);
    }

    /**
     * @dev Validates multiple signatures for a given hash
     * @param hash The hash that was signed
     * @param signer The account address (not individual signer)
     * @param signature Concatenated signatures (65 bytes each)
     * @return valid True if enough valid signatures are provided
     */
    function validateSignature(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external view override returns (bool valid) {
        MultiSigConfig storage config = configs[signer];
        
        if (!config.initialized) {
            return false;
        }

        // Check if signature length is valid (multiple of 65)
        if (signature.length == 0 || signature.length % 65 != 0) {
            return false;
        }

        uint256 signatureCount = signature.length / 65;
        if (signatureCount < config.threshold) {
            return false;
        }

        address[] memory recoveredSigners = new address[](signatureCount);
        uint256 validSignatures = 0;

        // Recover all signers
        for (uint256 i = 0; i < signatureCount; i++) {
            bytes memory sig = signature[i * 65:(i + 1) * 65];
            address recoveredSigner = hash.recover(sig);
            
            // Check if recovered signer is authorized and not already used
            if (_isAuthorizedSigner(config.signers, recoveredSigner) && 
                !_isDuplicate(recoveredSigners, validSignatures, recoveredSigner)) {
                recoveredSigners[validSignatures] = recoveredSigner;
                validSignatures++;
            }
        }

        valid = validSignatures >= config.threshold;
        return valid;
    }

    /**
     * @dev Check if an address is an authorized signer
     */
    function _isAuthorizedSigner(address[] memory signers, address signer) 
        internal 
        pure 
        returns (bool) 
    {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == signer) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Check if a signer is already in the recovered signers array
     */
    function _isDuplicate(
        address[] memory recoveredSigners,
        uint256 count,
        address signer
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < count; i++) {
            if (recoveredSigners[i] == signer) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get configuration for an account
     */
    function getConfig(address account) 
        external 
        view 
        returns (address[] memory signers, uint256 threshold, bool initialized) 
    {
        MultiSigConfig storage config = configs[account];
        return (config.signers, config.threshold, config.initialized);
    }
}