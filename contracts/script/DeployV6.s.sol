// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import "../src/SimpleAccountFactoryV6.sol";

contract DeployV6Script is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("ETH_PRIVATE_KEY");
        address entryPoint = vm.envAddress("ENTRY_POINT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SimpleAccountFactoryV6 factory = new SimpleAccountFactoryV6(IEntryPoint(entryPoint));
        
        console.log("SimpleAccountFactoryV6 deployed at:", address(factory));
        
        vm.stopBroadcast();
    }
}