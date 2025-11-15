import { ChildProcess, spawn } from "child_process";
import ora from "ora";

let currentProcess: ChildProcess | null = null;

async function promptUser(question: string): Promise<string> {
  const { default: readline } = await import("readline/promises");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(question);
  rl.close();
  return answer;
}

async function executeCommand(
  command: string[],
  cwd: string = process.cwd(),
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("\nExecuting command:", command.join(" "));

    currentProcess = spawn(command[0], command.slice(1), {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    currentProcess.on("close", (code) => {
      currentProcess = null;
      if (code === 0) {
        console.log("Command executed successfully");
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    currentProcess.on("error", (err) => {
      currentProcess = null;
      reject(new Error(`Failed to start command: ${err.message}`));
    });
  });
}

function cleanupAndExit() {
  console.log("\nInterrupted. Cleaning up...");
  if (currentProcess) {
    currentProcess.kill("SIGINT");
  }
  process.exit(0);
}

// Set up SIGINT handler
process.on("SIGINT", cleanupAndExit);

async function checkAccountExists(
  network: string,
  account: string,
): Promise<boolean> {
  try {
    const command = [
      "npx",
      "near-cli-rs",
      "account",
      "view-account-summary",
      account,
      "network-config",
      network,
      "now",
    ];
    await executeCommand(command);
    return true;
  } catch (error) {
    return false;
  }
}

async function createAccount(network: string, account: string): Promise<void> {
  const spinner = ora("Checking web4 subaccount").start();
  const subaccount = `web4.${account}`;
  try {
    const exists = await checkAccountExists(network, subaccount);
    if (exists) {
      spinner.succeed(`Web4 subaccount  already exists`);
      return;
    }

    spinner.text = "Creating web4 subaccount";
    const command = [
      "near",
      "account",
      "create-account",
      "fund-myself",
      subaccount,
      "'1 NEAR'",
      "autogenerate-new-keypair",
      "save-to-keychain",
      `sign-as`,
      account,
      "network-config",
      network,
    ];
    await executeCommand(command);
    spinner.succeed("Web4 subaccount created successfully");
  } catch (error) {
    spinner.fail(`Failed to create web4 subaccount: ${error}`);
    throw error;
  }
}

async function deployToWeb4(network: string, account: string): Promise<void> {
  const spinner = ora("Deploying to web4").start();
  try {
    const command = [
      "npx",
      "github:vgrichina/web4-deploy",
      "dist",
      account,
      "--deploy-contract",
      "--nearfs",
      "--network",
      network,
    ];
    await executeCommand(command);
    spinner.succeed("Deployed to web4 successfully");
  } catch (error) {
    spinner.fail(`Failed to deploy to web4: ${error}`);
    throw error;
  }
}

async function main() {
  console.log("Starting deployment process...");

  const network = await promptUser("Enter the network (mainnet/testnet): ");
  if (network !== "mainnet" && network !== "testnet") {
    throw new Error(
      'Invalid network. Please enter either "mainnet" or "testnet".',
    );
  }

  const accountSuffix = network === "mainnet" ? "near" : "testnet";
  const account = await promptUser(
    `Enter your account name (e.g root.${accountSuffix}): `,
  );
  const fullAccount = `web4.${account}`;

  console.log(`\nCreating your web4 account... web4.${account}`);
  await createAccount(network, account);

  console.log("\nDeploying profile to web4 contract...");
  await deployToWeb4(network, fullAccount);
}

main().catch((error) => {
  console.error("An error occurred:", error);
  cleanupAndExit();
});
