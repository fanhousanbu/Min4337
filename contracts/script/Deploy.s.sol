// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import "../src/SimpleAccountFactory.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("ETH_PRIVATE_KEY");
        address entryPoint = vm.envAddress("ENTRY_POINT_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        SimpleAccountFactory factory = new SimpleAccountFactory(IEntryPoint(entryPoint));
        
        console.log("SimpleAccountFactory deployed at:", address(factory));
        
        vm.stopBroadcast();
    }
}