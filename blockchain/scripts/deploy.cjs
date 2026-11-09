const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of AttendanceVerification.sol...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const AttendanceVerification = await hre.ethers.getContractFactory("AttendanceVerification");
  const attendanceContract = await AttendanceVerification.deploy();

  await attendanceContract.waitForDeployment();
  const contractAddress = await attendanceContract.getAddress();

  console.log("--------------------------------------------------");
  console.log("AttendanceVerification deployed successfully to:", contractAddress);
  console.log("Transaction Hash:", attendanceContract.deploymentTransaction().hash);
  console.log("--------------------------------------------------");

  // Export deployment details to deployment.json
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    address: contractAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    txHash: attendanceContract.deploymentTransaction().hash,
  };

  const deploymentPath = path.join(__dirname, "..", "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment information saved to:", deploymentPath);

  // Initialize a demo session on-chain for verification testing
  const blockNum = await hre.ethers.provider.getBlockNumber();
  const block = await hre.ethers.provider.getBlock(blockNum);
  const expirationTime = block.timestamp + 86400; // 24 hours

  console.log("Registering initial demo session on-chain...");
  const tx = await attendanceContract.createSession(
    "SES-2026-LIVE",
    "CLS-CS4A",
    "SUB-BC401",
    deployer.address,
    expirationTime
  );
  await tx.wait();
  console.log("Demo session SES-2026-LIVE registered on-chain!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
