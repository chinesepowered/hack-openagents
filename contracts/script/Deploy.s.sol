// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script, console2 } from "forge-std/Script.sol";
import { StrategyINFT } from "../src/StrategyINFT.sol";
import { StrategyVault } from "../src/StrategyVault.sol";
import { MockERC20 } from "../src/MockERC20.sol";
import { SettlementRouter } from "../src/SettlementRouter.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address protocolFeeReceiver = vm.envOr("PROTOCOL_FEE_RECEIVER", deployer);

        vm.startBroadcast(pk);

        // 1) Demo assets — Uniswap is not on 0G, so we mint our own stables.
        MockERC20 usdc = new MockERC20("Mock USDC", "mUSDC", 6);
        MockERC20 usdt = new MockERC20("Mock USDT", "mUSDT", 6);
        console2.log("mUSDC", address(usdc));
        console2.log("mUSDT", address(usdt));

        // 2) Settlement router — Uniswap-shaped swap calldata, 0G-side execution.
        SettlementRouter router = new SettlementRouter();
        router.setRate(address(usdc), address(usdt), 1e18); // 1:1
        router.setRate(address(usdt), address(usdc), 1e18);
        console2.log("SettlementRouter", address(router));

        // Seed depositor + router with USDC.
        usdc.mint(deployer, 100_000e6);
        usdc.mint(address(router), 1_000_000e6);
        usdt.mint(address(router), 1_000_000e6);

        // 3) Strategy iNFT registry.
        StrategyINFT inft = new StrategyINFT();
        console2.log("StrategyINFT", address(inft));

        // 4) Mint a seed strategy iNFT.
        uint256 tokenId = inft.mint(
            deployer,
            1000, // 10% royalty
            "og-storage://strategy/conservative-usdc/v1",
            keccak256("seed-conservative-usdc")
        );
        console2.log("Seed strategy tokenId", tokenId);

        // 5) Vault bound to that iNFT.
        StrategyVault vault = new StrategyVault(
            address(inft),
            tokenId,
            address(usdc),
            protocolFeeReceiver,
            "AgentFund Conservative USDC",
            "agfUSDC"
        );
        console2.log("StrategyVault", address(vault));

        vm.stopBroadcast();

        console2.log("\nAdd these to .env:");
        console2.log("NEXT_PUBLIC_DEMO_ASSET_ADDRESS=", address(usdc));
        console2.log("NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=", address(router));
        console2.log("NEXT_PUBLIC_STRATEGY_INFT_ADDRESS=", address(inft));
        console2.log("NEXT_PUBLIC_STRATEGY_VAULT_ADDRESS=", address(vault));
    }
}
