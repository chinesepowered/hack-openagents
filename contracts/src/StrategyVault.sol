// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { StrategyINFT } from "./StrategyINFT.sol";

/// @title StrategyVault
/// @notice Single-asset vault bound to a Strategy iNFT. Depositors receive
///         shares; the agent (set by the iNFT owner) routes trades. On every
///         realized fee distribution, the iNFT creator receives their royalty
///         share automatically — that's the "royalty splits on usage" promised
///         by the iNFT.
contract StrategyVault is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    StrategyINFT public immutable inft;
    uint256 public immutable strategyId;
    IERC20 public immutable asset;

    address public agent;
    address public protocolFeeReceiver;
    uint96 public protocolFeeBps = 500; // 5%

    event Deposit(address indexed user, uint256 assets, uint256 shares);
    event Withdraw(address indexed user, uint256 assets, uint256 shares);
    event AgentSet(address indexed agent);
    event FeesDistributed(
        uint256 grossFees,
        uint256 toCreator,
        uint256 toProtocol,
        uint256 toLPs
    );

    constructor(
        address inft_,
        uint256 strategyId_,
        address asset_,
        address protocolFeeReceiver_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        inft = StrategyINFT(inft_);
        strategyId = strategyId_;
        asset = IERC20(asset_);
        protocolFeeReceiver = protocolFeeReceiver_;
        agent = msg.sender;
    }

    modifier onlyINFTOwner() {
        require(inft.ownerOf(strategyId) == msg.sender, "not iNFT owner");
        _;
    }

    function setAgent(address newAgent) external onlyINFTOwner {
        agent = newAgent;
        emit AgentSet(newAgent);
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function deposit(uint256 assets, address receiver)
        external
        nonReentrant
        returns (uint256 shares)
    {
        require(assets > 0, "zero deposit");
        uint256 supply = totalSupply();
        shares = supply == 0 ? assets : (assets * supply) / totalAssets();
        asset.safeTransferFrom(msg.sender, address(this), assets);
        _mint(receiver, shares);
        emit Deposit(receiver, assets, shares);
    }

    function withdraw(uint256 shares, address receiver)
        external
        nonReentrant
        returns (uint256 assets)
    {
        require(shares > 0, "zero shares");
        assets = (shares * totalAssets()) / totalSupply();
        _burn(msg.sender, shares);
        asset.safeTransfer(receiver, assets);
        emit Withdraw(msg.sender, assets, shares);
    }

    /// @notice Called by the agent (or KeeperHub on its behalf) when a trade
    ///         realizes profit. Splits the gross fee between iNFT creator,
    ///         protocol, and the rest stays in the vault for LPs.
    function distributeFees(uint256 grossFees) external nonReentrant {
        require(msg.sender == agent, "only agent");
        require(grossFees <= totalAssets(), "fees > assets");

        (address creator, uint96 royaltyBps) = inft.royaltyReceiver(strategyId);
        uint256 toCreator = (grossFees * royaltyBps) / 10_000;
        uint256 toProtocol = (grossFees * protocolFeeBps) / 10_000;
        uint256 toLPs = grossFees - toCreator - toProtocol;

        if (toCreator > 0) asset.safeTransfer(creator, toCreator);
        if (toProtocol > 0) asset.safeTransfer(protocolFeeReceiver, toProtocol);
        // toLPs stays in the vault, increasing share price.

        emit FeesDistributed(grossFees, toCreator, toProtocol, toLPs);
    }
}
