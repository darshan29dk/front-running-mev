// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";

contract PremiumAccessNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    enum Tier {
        EarlyAlerts,
        AdvancedAnalytics,
        PrioritySupport
    }

    struct AccountBenefits {
        bool earlyAlerts;
        bool advancedAnalytics;
        bool prioritySupport;
    }

    Counters.Counter private tokenIdTracker;
    mapping(uint256 => Tier) private tokenTier;
    mapping(Tier => string) private tierURI;
    mapping(address => mapping(Tier => uint256)) private tierBalances;

    event PremiumMinted(address indexed to, uint256 indexed tokenId, Tier tier);
    event TierUriUpdated(Tier indexed tier, string uri);

    constructor(
        string memory name,
        string memory symbol,
        string[] memory tierUris
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(tierUris.length == 3, "Tier uri mismatch");
        tierURI[Tier.EarlyAlerts] = tierUris[0];
        tierURI[Tier.AdvancedAnalytics] = tierUris[1];
        tierURI[Tier.PrioritySupport] = tierUris[2];
    }

    function mintPremium(address to, Tier tier) external onlyOwner returns (uint256) {
        require(bytes(tierURI[tier]).length > 0, "Tier uri missing");
        require(to != address(0), "Invalid recipient");
        tokenIdTracker.increment();
        uint256 tokenId = tokenIdTracker.current();
        tokenTier[tokenId] = tier;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tierURI[tier]);
        emit PremiumMinted(to, tokenId, tier);
        return tokenId;
    }

    function batchMint(address[] calldata recipients, Tier tier) external onlyOwner {
        require(bytes(tierURI[tier]).length > 0, "Tier uri missing");
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            require(recipient != address(0), "Invalid recipient");
            tokenIdTracker.increment();
            uint256 tokenId = tokenIdTracker.current();
            tokenTier[tokenId] = tier;
            _safeMint(recipient, tokenId);
            _setTokenURI(tokenId, tierURI[tier]);
            emit PremiumMinted(recipient, tokenId, tier);
        }
    }

    function setTierUri(Tier tier, string calldata uri) external onlyOwner {
        require(bytes(uri).length > 0, "Invalid uri");
        tierURI[tier] = uri;
        emit TierUriUpdated(tier, uri);
    }

    function getTierUri(Tier tier) external view returns (string memory) {
        return tierURI[tier];
    }

    function getTier(uint256 tokenId) external view returns (Tier) {
        require(_exists(tokenId), "Nonexistent token");
        return tokenTier[tokenId];
    }

    function tierBalanceOf(address account, Tier tier) external view returns (uint256) {
        return tierBalances[account][tier];
    }

    function hasTier(address account, Tier tier) external view returns (bool) {
        return tierBalances[account][tier] > 0;
    }

    function accountBenefits(address account) external view returns (AccountBenefits memory benefits) {
        benefits.earlyAlerts = tierBalances[account][Tier.EarlyAlerts] > 0;
        benefits.advancedAnalytics = tierBalances[account][Tier.AdvancedAnalytics] > 0;
        benefits.prioritySupport = tierBalances[account][Tier.PrioritySupport] > 0;
    }

    function tierPrivileges(Tier tier) external pure returns (string memory) {
        if (tier == Tier.EarlyAlerts) {
            return "Early alerts";
        }
        if (tier == Tier.AdvancedAnalytics) {
            return "Advanced analytics";
        }
        return "Priority support";
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        Tier tier = tokenTier[tokenId];
        if (from != address(0)) {
            tierBalances[from][tier] -= 1;
        }
        if (to != address(0)) {
            tierBalances[to][tier] += 1;
        }
        super._afterTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        delete tokenTier[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
