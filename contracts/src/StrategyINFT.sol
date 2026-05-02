// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title StrategyINFT
/// @notice ERC-7857 style intelligent NFT. Each token represents a trading
///         strategy whose intelligence (system prompt, params, optional model
///         weights pointer) lives encrypted on 0G Storage. The on-chain token
///         tracks identity, ownership, royalty receiver and version.
contract StrategyINFT is ERC721, Ownable {
    struct Strategy {
        address creator;
        uint96 royaltyBps;
        string ogStorageURI;
        bytes32 intelligenceHash;
        uint64 version;
        uint64 createdAt;
    }

    uint256 public nextId = 1;
    mapping(uint256 => Strategy) public strategies;

    event StrategyMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint96 royaltyBps,
        string ogStorageURI,
        bytes32 intelligenceHash
    );

    event StrategyUpgraded(
        uint256 indexed tokenId,
        uint64 newVersion,
        string newOgStorageURI,
        bytes32 newIntelligenceHash
    );

    constructor() ERC721("AgentFund Strategy", "AGFS") Ownable(msg.sender) { }

    function mint(
        address to,
        uint96 royaltyBps,
        string calldata ogStorageURI,
        bytes32 intelligenceHash
    ) external returns (uint256 tokenId) {
        require(royaltyBps <= 2_000, "royalty > 20%");
        tokenId = nextId++;
        strategies[tokenId] = Strategy({
            creator: to,
            royaltyBps: royaltyBps,
            ogStorageURI: ogStorageURI,
            intelligenceHash: intelligenceHash,
            version: 1,
            createdAt: uint64(block.timestamp)
        });
        _safeMint(to, tokenId);
        emit StrategyMinted(tokenId, to, royaltyBps, ogStorageURI, intelligenceHash);
    }

    /// @notice Upgrade the intelligence pointer for an existing strategy.
    ///         Caller must own the iNFT. Used when the agent learns and the
    ///         encrypted prompt or weights pointer changes on 0G Storage.
    function upgrade(
        uint256 tokenId,
        string calldata newOgStorageURI,
        bytes32 newIntelligenceHash
    ) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        Strategy storage s = strategies[tokenId];
        s.ogStorageURI = newOgStorageURI;
        s.intelligenceHash = newIntelligenceHash;
        s.version += 1;
        emit StrategyUpgraded(tokenId, s.version, newOgStorageURI, newIntelligenceHash);
    }

    function royaltyReceiver(uint256 tokenId) external view returns (address, uint96) {
        Strategy memory s = strategies[tokenId];
        return (s.creator, s.royaltyBps);
    }
}
