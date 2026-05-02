// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MockERC20 } from "./MockERC20.sol";

/// @title SettlementRouter
/// @notice Tiny on-0G stand-in for a Uniswap router. Uniswap is not deployed
///         on 0G testnet, so we settle agent decisions here. Selector and
///         signature mirror Uniswap V2's `swapExactTokensForTokens` so the
///         off-chain agent calldata builder is realistic.
///
/// @dev    For demo purposes only: this is a 1:1 minter that pulls `amountIn`
///         of `path[0]` and mints `amountOut` of `path[last]` to `to`. The
///         out amount is computed from a constant exchange rate set by the
///         deployer per pair, plus a configurable fee in bps.
contract SettlementRouter {
    using SafeERC20 for IERC20;

    address public owner;
    uint16 public feeBps = 5; // 5 bps

    struct Rate {
        uint128 numerator;
        uint128 denominator;
    }

    /// rate[in][out] = price of 1 in expressed in out, scaled by 1e18
    mapping(address => mapping(address => uint256)) public rate;

    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address to
    );

    constructor() {
        owner = msg.sender;
    }

    function setRate(address tokenIn, address tokenOut, uint256 rate_) external {
        require(msg.sender == owner, "not owner");
        rate[tokenIn][tokenOut] = rate_;
    }

    function setFee(uint16 bps) external {
        require(msg.sender == owner, "not owner");
        require(bps <= 1000, "fee too high");
        feeBps = bps;
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "deadline");
        require(path.length >= 2, "bad path");

        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            uint256 r = rate[path[i]][path[i + 1]];
            require(r > 0, "no rate");
            uint256 gross = (amounts[i] * r) / 1e18;
            uint256 fee = (gross * feeBps) / 10_000;
            amounts[i + 1] = gross - fee;
        }
        require(amounts[amounts.length - 1] >= amountOutMin, "slippage");

        // Mint the output token to recipient (this contract has mint role
        // by being the deployer of MockERC20s in the demo).
        MockERC20(path[path.length - 1]).mint(to, amounts[amounts.length - 1]);

        emit Swap(
            msg.sender,
            path[0],
            path[path.length - 1],
            amountIn,
            amounts[amounts.length - 1],
            to
        );
    }
}
