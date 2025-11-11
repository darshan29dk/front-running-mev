const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const initialRecipients = [deployer.address];
  const initialAmounts = [ethers.utils.parseEther("1000000")];
  const governanceToken = await GovernanceToken.deploy(
    "MEV Governance Token",
    "MEV",
    initialRecipients,
    initialAmounts
  );
  await governanceToken.deployed();

  const Timelock = await ethers.getContractFactory("DAOTimelock");
  const minDelay = 3600;
  const timelock = await Timelock.deploy(minDelay, [], [], deployer.address);
  await timelock.deployed();

  const Governor = await ethers.getContractFactory("MEVGovernor");
  const votingDelay = 1;
  const votingPeriod = 45818;
  const proposalThreshold = ethers.utils.parseEther("10000");
  const quorum = 10;
  const governor = await Governor.deploy(
    governanceToken.address,
    timelock.address,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorum
  );
  await governor.deployed();

  await (await governanceToken.connect(deployer).delegate(deployer.address)).wait();

  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  await (await timelock.grantRole(proposerRole, governor.address)).wait();
  await (await timelock.grantRole(executorRole, ethers.constants.AddressZero)).wait();
  await (await timelock.revokeRole(adminRole, deployer.address)).wait();

  await (await governanceToken.transferOwnership(timelock.address)).wait();

  const PremiumAccessNFT = await ethers.getContractFactory("PremiumAccessNFT");
  const tierUris = [
    "ipfs://premium/early-alerts",
    "ipfs://premium/advanced-analytics",
    "ipfs://premium/priority-support"
  ];
  const premiumNft = await PremiumAccessNFT.deploy("MEV Premium Access", "MEVP", tierUris);
  await premiumNft.deployed();

  await (await premiumNft.mintPremium(deployer.address, 0)).wait();
  await (await premiumNft.mintPremium(deployer.address, 1)).wait();
  await (await premiumNft.mintPremium(deployer.address, 2)).wait();

  const MEVDetector = await ethers.getContractFactory("MEVDetector");
  const detector = await MEVDetector.deploy();
  await detector.deployed();

  const MEVSimulator = await ethers.getContractFactory("MEVSimulator");
  const simulator = await MEVSimulator.deploy();
  await simulator.deployed();

  const contracts = {
    GovernanceToken: governanceToken.address,
    DAOTimelock: timelock.address,
    MEVGovernor: governor.address,
    PremiumAccessNFT: premiumNft.address,
    MEVDetector: detector.address,
    MEVSimulator: simulator.address
  };

  fs.writeFileSync("./contract-addresses.json", JSON.stringify(contracts, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
