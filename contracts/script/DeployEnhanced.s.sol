// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import "../src/SimpleAccountFactoryV6Enhanced.sol";
import "../src/ECDSAValidator.sol";
import "../src/MultiSigValidator.sol";

contract DeployEnhancedScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("ETH_PRIVATE_KEY");
        address entryPoint = vm.envAddress("ENTRY_POINT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy validators
        console.log("Deploying ECDSA Validator...");
        ECDSAValidator ecdsaValidator = new ECDSAValidator(false); // disable replay protection for testing
        console.log("ECDSAValidator deployed at:", address(ecdsaValidator));
        
        console.log("Deploying MultiSig Validator...");
        MultiSigValidator multiSigValidator = new MultiSigValidator();
        console.log("MultiSigValidator deployed at:", address(multiSigValidator));
        
        // Deploy enhanced factory
        console.log("Deploying Enhanced Factory...");
        SimpleAccountFactoryV6Enhanced factory = new SimpleAccountFactoryV6Enhanced(IEntryPoint(entryPoint));
        console.log("SimpleAccountFactoryV6Enhanced deployed at:", address(factory));
        
        // Deploy a test account with ECDSA validator
        address testOwner = vm.addr(deployerPrivateKey);
        console.log("Test owner address:", testOwner);
        
        SimpleAccountV6Enhanced testAccount = factory.createAccountWithValidator(
            testOwner,
            address(ecdsaValidator),
            true, // use custom validator
            12345 // test salt
        );
        console.log("Test account with ECDSA validator deployed at:", address(testAccount));
        
        // Deploy a standard account for comparison
        SimpleAccountV6Enhanced standardAccount = factory.createAccount(testOwner, 54321);
        console.log("Standard account deployed at:", address(standardAccount));
        
        vm.stopBroadcast();
        
        // Log summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("EntryPoint:", entryPoint);
        console.log("ECDSA Validator:", address(ecdsaValidator));
        console.log("MultiSig Validator:", address(multiSigValidator));
        console.log("Enhanced Factory:", address(factory));
        console.log("Test Account (Custom Validator):", address(testAccount));
        console.log("Standard Account:", address(standardAccount));
    }
}