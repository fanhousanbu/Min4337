// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./ISignatureValidator.sol";

interface IAccount {
    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external returns (uint256 validationData);
}

struct UserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    uint256 callGasLimit;
    uint256 verificationGasLimit;
    uint256 preVerificationGas;
    uint256 maxFeePerGas;
    uint256 maxPriorityFeePerGas;
    bytes paymasterAndData;
    bytes signature;
}

interface IEntryPoint {
    function getNonce(address sender, uint192 key) external view returns (uint256 nonce);
    function depositTo(address account) external payable;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SimpleAccountV6Enhanced
 * @dev Enhanced ERC-4337 account with pluggable signature validation
 */
contract SimpleAccountV6Enhanced is IAccount, UUPSUpgradeable, Initializable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Account owner (for default ECDSA validation)
    address public owner;
    
    // Custom signature validator contract
    ISignatureValidator public signatureValidator;
    
    // Flag to use custom validator vs default ECDSA
    bool public useCustomValidator;

    IEntryPoint private immutable _entryPoint;

    // Events
    event SimpleAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
    event SignatureValidatorSet(address indexed validator, bool useCustom);
    event CustomValidationUsed(address indexed validator, bool success);

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    constructor(IEntryPoint anEntryPoint) {
        _entryPoint = anEntryPoint;
        _disableInitializers();
    }

    function _onlyOwner() internal view {
        require(msg.sender == owner || msg.sender == address(this), "account: not Owner or self");
    }

    /**
     * @dev Initialize account with owner and optional custom validator
     */
    function initialize(
        address anOwner,
        address _signatureValidator,
        bool _useCustomValidator
    ) public virtual initializer {
        _initialize(anOwner, _signatureValidator, _useCustomValidator);
    }

    /**
     * @dev Initialize with just owner (backward compatibility)
     */
    function initialize(address anOwner) public virtual initializer {
        _initialize(anOwner, address(0), false);
    }

    function _initialize(
        address anOwner,
        address _signatureValidator,
        bool _useCustomValidator
    ) internal virtual {
        owner = anOwner;
        
        if (_signatureValidator != address(0)) {
            signatureValidator = ISignatureValidator(_signatureValidator);
            useCustomValidator = _useCustomValidator;
            emit SignatureValidatorSet(_signatureValidator, _useCustomValidator);
        }
        
        emit SimpleAccountInitialized(_entryPoint, owner);
    }

    /**
     * @dev Set custom signature validator
     */
    function setSignatureValidator(
        address _signatureValidator,
        bool _useCustomValidator
    ) external onlyOwner {
        if (_signatureValidator != address(0)) {
            signatureValidator = ISignatureValidator(_signatureValidator);
        }
        useCustomValidator = _useCustomValidator;
        emit SignatureValidatorSet(_signatureValidator, _useCustomValidator);
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    function executeBatch(address[] calldata dest, bytes[] calldata func) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    function entryPoint() public view virtual returns (IEntryPoint) {
        return _entryPoint;
    }

    function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external virtual override returns (uint256 validationData) {
        _requireFromEntryPoint();
        validationData = _validateSignature(userOp, userOpHash);
        _validateNonce(userOp.nonce);
        _payPrefund(missingAccountFunds);
    }

    /**
     * @dev Enhanced signature validation with custom validator support
     */
    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
        internal returns (uint256 validationData) {
        
        bytes32 hash = userOpHash.toEthSignedMessageHash();
        
        // Use custom validator if enabled and available
        if (useCustomValidator && address(signatureValidator) != address(0)) {
            try signatureValidator.validateSignature(hash, owner, userOp.signature) 
                returns (bool isValid) {
                emit CustomValidationUsed(address(signatureValidator), isValid);
                return isValid ? 0 : 1;
            } catch {
                emit CustomValidationUsed(address(signatureValidator), false);
                // Fall back to default ECDSA validation if custom validator fails
            }
        }
        
        // Default ECDSA validation
        if (owner != hash.recover(userOp.signature)) {
            return 1;
        }
        return 0;
    }

    /**
     * @dev Get current validation mode and validator
     */
    function getValidationConfig() external view returns (
        address validator,
        bool isCustom,
        address accountOwner
    ) {
        return (address(signatureValidator), useCustomValidator, owner);
    }

    function _validateNonce(uint256) internal view virtual {
        // no-op
    }

    function _payPrefund(uint256 missingAccountFunds) internal virtual {
        if (missingAccountFunds != 0) {
            (bool success,) = payable(msg.sender).call{value: missingAccountFunds, gas: type(uint256).max}("");
            (success);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _requireFromEntryPoint() internal view virtual {
        require(msg.sender == address(entryPoint()), "account: not from EntryPoint");
    }

    function _requireFromEntryPointOrOwner() internal view {
        require(msg.sender == address(entryPoint()) || msg.sender == owner, "account: not Owner or EntryPoint");
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        _onlyOwner();
    }

    receive() external payable {}
}