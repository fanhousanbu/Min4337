// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SimpleAccountV6Enhanced.sol";

/**
 * @title SimpleAccountFactoryV6Enhanced
 * @dev Factory for creating enhanced accounts with custom signature validation
 */
contract SimpleAccountFactoryV6Enhanced {
    SimpleAccountV6Enhanced public immutable accountImplementation;

    // Events
    event AccountCreated(
        address indexed account, 
        address indexed owner, 
        address signatureValidator,
        bool useCustomValidator,
        uint256 salt
    );

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new SimpleAccountV6Enhanced(_entryPoint);
    }

    /**
     * @dev Create account with standard ECDSA validation
     */
    function createAccount(address owner, uint256 salt) 
        public 
        returns (SimpleAccountV6Enhanced ret) 
    {
        return createAccountWithValidator(owner, address(0), false, salt);
    }

    /**
     * @dev Create account with custom signature validator
     * @param owner The account owner
     * @param signatureValidator Address of the custom validator contract
     * @param useCustomValidator Whether to use the custom validator by default
     * @param salt Salt for deterministic address generation
     */
    function createAccountWithValidator(
        address owner,
        address signatureValidator,
        bool useCustomValidator,
        uint256 salt
    ) public returns (SimpleAccountV6Enhanced ret) {
        address addr = getAddress(owner, signatureValidator, useCustomValidator, salt);
        uint codeSize = addr.code.length;
        
        if (codeSize > 0) {
            return SimpleAccountV6Enhanced(payable(addr));
        }
        
        ret = SimpleAccountV6Enhanced(payable(new ERC1967Proxy{salt: bytes32(salt)}(
                address(accountImplementation),
                abi.encodeWithSignature(
                    "initialize(address,address,bool)", 
                    owner, signatureValidator, useCustomValidator
                )
            )));

        emit AccountCreated(address(ret), owner, signatureValidator, useCustomValidator, salt);
    }

    /**
     * @dev Get deterministic address for standard account
     */
    function getAddress(address owner, uint256 salt) 
        public 
        view 
        returns (address) 
    {
        return getAddress(owner, address(0), false, salt);
    }

    /**
     * @dev Get deterministic address for enhanced account with custom validator
     */
    function getAddress(
        address owner,
        address signatureValidator,
        bool useCustomValidator,
        uint256 salt
    ) public view returns (address) {
        return Create2.computeAddress(
            bytes32(salt), 
            keccak256(abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(
                    address(accountImplementation),
                    abi.encodeWithSignature(
                        "initialize(address,address,bool)", 
                        owner, signatureValidator, useCustomValidator
                    )
                )
            ))
        );
    }

    /**
     * @dev Batch create multiple accounts with different configurations
     */
    function batchCreateAccounts(
        address[] calldata owners,
        address[] calldata signatureValidators,
        bool[] calldata useCustomValidators,
        uint256[] calldata salts
    ) external returns (SimpleAccountV6Enhanced[] memory accounts) {
        require(
            owners.length == signatureValidators.length &&
            owners.length == useCustomValidators.length &&
            owners.length == salts.length,
            "Array length mismatch"
        );

        accounts = new SimpleAccountV6Enhanced[](owners.length);
        
        for (uint256 i = 0; i < owners.length; i++) {
            accounts[i] = createAccountWithValidator(
                owners[i],
                signatureValidators[i],
                useCustomValidators[i],
                salts[i]
            );
        }
    }

    /**
     * @dev Get account implementation address
     */
    function getImplementation() external view returns (address) {
        return address(accountImplementation);
    }
}