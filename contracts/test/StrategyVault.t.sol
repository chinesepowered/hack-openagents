// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { StrategyINFT } from "../src/StrategyINFT.sol";
import { StrategyVault } from "../src/StrategyVault.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1_000_000e6);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract StrategyVaultTest is Test {
    StrategyINFT inft;
    StrategyVault vault;
    MockUSDC usdc;

    address creator = address(0xC0FFEE);
    address protocol = address(0xBEEF);
    address depositor = address(0xD1);

    function setUp() public {
        inft = new StrategyINFT();
        usdc = new MockUSDC();

        uint256 tokenId =
            inft.mint(creator, 1000, "og-storage://test", keccak256("test"));

        vault = new StrategyVault(
            address(inft),
            tokenId,
            address(usdc),
            protocol,
            "Test Vault",
            "tVLT"
        );

        usdc.mint(depositor, 1_000e6);
        usdc.mint(address(vault), 0);
    }

    function test_deposit_withdraw() public {
        vm.startPrank(depositor);
        usdc.approve(address(vault), 1_000e6);
        uint256 shares = vault.deposit(1_000e6, depositor);
        assertEq(shares, 1_000e6);
        uint256 out = vault.withdraw(shares, depositor);
        assertEq(out, 1_000e6);
        vm.stopPrank();
    }

    function test_distributeFees_splits_correctly() public {
        // depositor seeds the vault
        vm.startPrank(depositor);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6, depositor);
        vm.stopPrank();

        // simulate 100 USDC of realized fees: 10% creator, 5% protocol, rest LPs
        uint256 creatorBefore = usdc.balanceOf(creator);
        uint256 protocolBefore = usdc.balanceOf(protocol);

        // agent is the deployer (this test contract)
        vault.distributeFees(100e6);

        assertEq(usdc.balanceOf(creator) - creatorBefore, 10e6, "creator 10%");
        assertEq(usdc.balanceOf(protocol) - protocolBefore, 5e6, "protocol 5%");
    }
}
