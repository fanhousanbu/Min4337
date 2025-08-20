// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./ISignatureValidator.sol";

/**
 * @title ECDSAValidator
 * @dev A simple ECDSA signature validator contract
 * @notice This contract provides enhanced ECDSA validation with additional features
 */
contract ECDSAValidator is ISignatureValidator {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Events for tracking validation attempts
    event SignatureValidated(address indexed signer, bytes32 indexed hash, bool valid);
    event ValidationFailed(address indexed signer, bytes32 indexed hash, string reason);

    // Mapping to track nonces for replay protection (optional)
    mapping(address => mapping(bytes32 => bool)) public usedHashes;
    
    // Flag to enable/disable replay protection
    bool public replayProtectionEnabled;
    
    // Contract owner for configuration
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "ECDSAValidator: not owner");
        _;
    }

    constructor(bool _replayProtectionEnabled) {
        owner = msg.sender;
        replayProtectionEnabled = _replayProtectionEnabled;
    }

    /**
     * @dev Validates an ECDSA signature
     * @param hash The hash that was signed (already prefixed with Ethereum message prefix)
     * @param signer The expected signer address
     * @param signature The ECDSA signature to validate
     * @return valid True if signature is valid and from the expected signer
     */
    function validateSignature(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external override returns (bool valid) {
        // Check signature length
        if (signature.length != 65) {
            emit ValidationFailed(signer, hash, "Invalid signature length");
            return false;
        }

        // Check for replay if enabled
        if (replayProtectionEnabled && usedHashes[signer][hash]) {
            emit ValidationFailed(signer, hash, "Hash already used");
            return false;
        }

        // Recover signer from signature
        address recoveredSigner = hash.recover(signature);
        
        // Validate signer
        valid = (recoveredSigner == signer && recoveredSigner != address(0));
        
        if (valid && replayProtectionEnabled) {
            usedHashes[signer][hash] = true;
        }

        emit SignatureValidated(signer, hash, valid);
        
        if (!valid) {
            emit ValidationFailed(signer, hash, "Signature verification failed");
        }

        return valid;
    }

    /**
     * @dev Validates an ECDSA signature (view function version for gas efficiency)
     */
    function validateSignatureView(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external view returns (bool valid) {
        if (signature.length != 65) {
            return false;
        }

        if (replayProtectionEnabled && usedHashes[signer][hash]) {
            return false;
        }

        address recoveredSigner = hash.recover(signature);
        return (recoveredSigner == signer && recoveredSigner != address(0));
    }

    /**
     * @dev Enable or disable replay protection
     */
    function setReplayProtection(bool _enabled) external onlyOwner {
        replayProtectionEnabled = _enabled;
    }

    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ECDSAValidator: zero address");
        owner = newOwner;
    }
}