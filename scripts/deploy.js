const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();

    console.log("Deploying from:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(
        deployer.address
    );

    console.log(
        "Wallet balance:",
        hre.ethers.formatEther(balance),
        "tMSTC"
    );

    const ModelBounty = await hre.ethers.getContractFactory(
        "ModelBounty"
    );

    const contract = await ModelBounty.deploy();

    await contract.waitForDeployment();

    const address = await contract.getAddress();

    console.log("================================");
    console.log("ModelBounty deployed!");
    console.log("Contract:", address);
    console.log("================================");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});