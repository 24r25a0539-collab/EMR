import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying EMRIntegrityRegistry contract to EVM network...");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  const EMRIntegrityRegistry = await ethers.getContractFactory("EMRIntegrityRegistry");
  const registry = await EMRIntegrityRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("✅ EMRIntegrityRegistry deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  console.log("🔗 Network:", (await ethers.provider.getNetwork()).name);
}

main().catch((error) => {
  console.error("❌ Error deploying contract:", error);
  process.exitCode = 1;
});
