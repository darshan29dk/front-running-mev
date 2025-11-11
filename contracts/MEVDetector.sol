// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MEVDetector {
    uint256 private constant SCORE_MAX = 100;
    uint256 private constant MAGNITUDE_UNIT = 1e15;

    struct Attack {
        address victim;
        address attacker;
        string attackType;
        uint256 riskScore;
        uint256 slippageAmount;
        uint256 timestamp;
    }

    mapping(address => bool) public protectedUsers;
    mapping(address => uint256) public userRiskScores;
    Attack[] public attacks;
    uint256 public totalAttacks;
    uint256 public totalProtectedUsers;

    event AttackDetected(
        address indexed victim,
        address indexed attacker,
        string attackType,
        uint256 riskScore,
        uint256 slippageAmount,
        uint256 timestamp
    );

    event UserProtected(address indexed user, bool status);

    event SandwichAttackDetected(
        address indexed victim,
        address indexed frontrunner,
        address indexed backrunner,
        address asset,
        uint256 victimAmountIn,
        uint256 victimAmountOut,
        uint256 frontrunnerProfit,
        uint256 timestamp,
        uint256 riskScore,
        uint256 slippageAmount
    );

    event ArbitrageLoopDetected(
        address indexed executor,
        bytes32 indexed loopId,
        address[] path,
        uint256[] tradeVolumes,
        uint256 profit,
        uint256 timestamp,
        uint256 riskScore,
        uint256 totalVolume
    );

    event LiquidationDetected(
        address indexed liquidator,
        address indexed liquidatedAccount,
        address debtAsset,
        address collateralAsset,
        uint256 debtRepaid,
        uint256 collateralSeized,
        uint256 profit,
        uint256 timestamp,
        uint256 riskScore,
        uint256 excessCollateral
    );

    function reportAttack(
        address _victim,
        address _attacker,
        string memory _attackType,
        uint256 _riskScore,
        uint256 _slippageAmount
    ) external {
        _recordAttack(
            _victim,
            _attacker,
            _attackType,
            _riskScore,
            _slippageAmount
        );
    }

    function detectSandwich(
        address victim,
        address frontrunner,
        address backrunner,
        address asset,
        uint256 victimAmountIn,
        uint256 victimAmountOut,
        uint256 frontrunnerProfit
    ) external {
        require(victim != address(0), "Victim required");
        require(frontrunner != address(0), "Frontrunner required");
        require(backrunner != address(0), "Backrunner required");
        require(asset != address(0), "Asset required");
        require(victimAmountIn > victimAmountOut, "No sandwich slippage");
        require(frontrunnerProfit > 0, "Profit must be positive");

        uint256 slippage = victimAmountIn - victimAmountOut;
        uint256 risk = _deriveRiskScore(40, frontrunnerProfit, slippage);

        _recordAttack(victim, frontrunner, "sandwich", risk, slippage);

        emit SandwichAttackDetected(
            victim,
            frontrunner,
            backrunner,
            asset,
            victimAmountIn,
            victimAmountOut,
            frontrunnerProfit,
            block.timestamp,
            risk,
            slippage
        );
    }

    function detectArbitrageLoop(
        address executor,
        address[] calldata path,
        uint256[] calldata amounts,
        uint256 profit,
        bytes32 loopId
    ) external {
        require(executor != address(0), "Executor required");
        require(loopId != bytes32(0), "Loop id required");
        require(path.length >= 2, "Path length invalid");
        require(path[0] == path[path.length - 1], "Path must loop");
        require(amounts.length == path.length - 1, "Amounts length mismatch");
        require(amounts.length > 0, "No trade volumes");
        require(profit > 0, "Profit must be positive");

        uint256 volume;
        for (uint256 i = 0; i < amounts.length; i++) {
            require(amounts[i] > 0, "Amount must be positive");
            volume += amounts[i];
        }

        uint256 averageTradeSize = volume / amounts.length;
        uint256 risk = _deriveRiskScore(25, profit, averageTradeSize);

        _recordAttack(address(0), executor, "arbitrage", risk, 0);

        emit ArbitrageLoopDetected(
            executor,
            loopId,
            path,
            amounts,
            profit,
            block.timestamp,
            risk,
            volume
        );
    }

    function detectLiquidation(
        address liquidator,
        address liquidatedAccount,
        address debtAsset,
        address collateralAsset,
        uint256 debtRepaid,
        uint256 collateralSeized,
        uint256 profit
    ) external {
        require(liquidator != address(0), "Liquidator required");
        require(liquidatedAccount != address(0), "Account required");
        require(debtAsset != address(0), "Debt asset required");
        require(collateralAsset != address(0), "Collateral asset required");
        require(debtRepaid > 0, "Debt repaid must be positive");
        require(collateralSeized >= debtRepaid, "Invalid collateral amount");
        require(profit > 0, "Profit must be positive");

        uint256 excessCollateral = collateralSeized - debtRepaid;
        uint256 risk = _deriveRiskScore(35, profit, collateralSeized);

        _recordAttack(liquidatedAccount, liquidator, "liquidation", risk, excessCollateral);

        emit LiquidationDetected(
            liquidator,
            liquidatedAccount,
            debtAsset,
            collateralAsset,
            debtRepaid,
            collateralSeized,
            profit,
            block.timestamp,
            risk,
            excessCollateral
        );
    }

    function enableProtection() external {
        if (!protectedUsers[msg.sender]) {
            protectedUsers[msg.sender] = true;
            totalProtectedUsers++;
            emit UserProtected(msg.sender, true);
        }
    }

    function disableProtection() external {
        if (protectedUsers[msg.sender]) {
            protectedUsers[msg.sender] = false;
            totalProtectedUsers--;
            emit UserProtected(msg.sender, false);
        }
    }

    function getAttackStats() external view returns (
        uint256 todayAttacks,
        uint256 avgRiskScore,
        uint256 totalSlippage
    ) {
        uint256 dayStart = block.timestamp - 1 days;
        uint256 riskScoreSum;

        for (uint256 i = attacks.length; i > 0 && attacks[i - 1].timestamp >= dayStart; i--) {
            todayAttacks++;
            riskScoreSum += attacks[i - 1].riskScore;
            totalSlippage += attacks[i - 1].slippageAmount;
        }

        avgRiskScore = todayAttacks > 0 ? riskScoreSum / todayAttacks : 0;
    }

    function getAttacksByType(uint256 startTime) external view returns (
        uint256 sandwichAttacks,
        uint256 frontRunAttacks,
        uint256 backRunAttacks
    ) {
        for (uint256 i = attacks.length; i > 0; i--) {
            Attack memory attack = attacks[i - 1];
            if (attack.timestamp < startTime) break;

            if (keccak256(bytes(attack.attackType)) == keccak256(bytes("sandwich"))) {
                sandwichAttacks++;
            } else if (keccak256(bytes(attack.attackType)) == keccak256(bytes("frontrun"))) {
                frontRunAttacks++;
            } else if (keccak256(bytes(attack.attackType)) == keccak256(bytes("backrun"))) {
                backRunAttacks++;
            }
        }
    }

    function _recordAttack(
        address victim,
        address attacker,
        string memory attackType,
        uint256 riskScore,
        uint256 slippageAmount
    ) internal {
        require(riskScore <= SCORE_MAX, "Risk score must be <= 100");

        attacks.push(Attack({
            victim: victim,
            attacker: attacker,
            attackType: attackType,
            riskScore: riskScore,
            slippageAmount: slippageAmount,
            timestamp: block.timestamp
        }));

        totalAttacks++;

        if (victim != address(0)) {
            userRiskScores[victim] = (riskScore + (userRiskScores[victim] * 2)) / 3;
        }

        emit AttackDetected(
            victim,
            attacker,
            attackType,
            riskScore,
            slippageAmount,
            block.timestamp
        );
    }

    function _deriveRiskScore(
        uint256 baseScore,
        uint256 profitMagnitude,
        uint256 impactMagnitude
    ) internal pure returns (uint256) {
        uint256 profitScore = profitMagnitude / MAGNITUDE_UNIT;
        if (profitScore > 60) {
            profitScore = 60;
        }

        uint256 impactScore = impactMagnitude / MAGNITUDE_UNIT;
        if (impactScore > 40) {
            impactScore = 40;
        }

        uint256 score = baseScore + profitScore + impactScore;
        if (score > SCORE_MAX) {
            score = SCORE_MAX;
        }

        if (score < baseScore) {
            score = baseScore;
        }

        return score;
    }
}
