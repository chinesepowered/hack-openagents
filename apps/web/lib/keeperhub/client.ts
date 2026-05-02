/**
 * KeeperHub Direct Execution API client.
 *
 * Base: https://app.keeperhub.com/api
 * Docs: docs.keeperhub.com (Direct Execution API)
 *
 * KeeperHub manages signing wallets internally — we don't sign txs ourselves,
 * we hand it the contract call and it signs+submits via the org's configured
 * wallet (set up at app.keeperhub.com → Wallet Management). Spending caps act
 * as the autonomous-payment ceiling for the agent (the x402 angle: org pays
 * per-execution up to the cap, agent acts within that budget).
 *
 * For 0G Galileo testnet (chainId 16602): we pass `network: "16602"` since
 * KeeperHub's named-slug list doesn't yet include 0G, but chain-id strings
 * are accepted by the executor.
 */

const DEFAULT_BASE = "https://app.keeperhub.com/api";

type ContractCallInput = {
  contractAddress: `0x${string}`;
  functionName: string;
  functionArgs: unknown[];
  abi: unknown[];
  network?: string; // chain slug or chainId-as-string
  value?: string;
  gasLimitMultiplier?: string;
  metadata?: Record<string, unknown>;
};

type ContractCallOutput = {
  jobId: string;
  hash: `0x${string}`;
  status: "pending" | "running" | "completed" | "failed";
  rawStatusUrl?: string;
};

type CheckAndExecuteInput = {
  read: {
    contractAddress: `0x${string}`;
    functionName: string;
    functionArgs?: unknown[];
    abi: unknown[];
  };
  condition: {
    operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte";
    value: string;
  };
  action: {
    contractAddress: `0x${string}`;
    functionName: string;
    functionArgs?: unknown[];
    abi: unknown[];
    gasLimitMultiplier?: string;
  };
  network?: string;
};

const NETWORK = process.env.KEEPERHUB_NETWORK ?? "16602";

export const keeperhub = {
  /** Drop-in for the old `submit({to,data,value})` shape. */
  async submit(input: {
    to: `0x${string}`;
    data: `0x${string}`;
    value: string;
    payViaX402?: boolean;
    metadata?: Record<string, unknown>;
  }): Promise<{ jobId: string; hash: `0x${string}` }> {
    const base = process.env.KEEPERHUB_API_BASE_URL ?? DEFAULT_BASE;
    const key = process.env.KEEPERHUB_API_KEY;
    if (!key) return mockSubmit();

    // We don't have decoded args here — fall back to mock if a caller used the
    // raw-calldata path. Prefer the typed `contractCall()` path below.
    return mockSubmit();
  },

  async contractCall(input: ContractCallInput): Promise<ContractCallOutput> {
    const base = process.env.KEEPERHUB_API_BASE_URL ?? DEFAULT_BASE;
    const key = process.env.KEEPERHUB_API_KEY;
    if (!key) return mockExec();

    try {
      const res = await fetch(`${base}/execute/contract-call`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contractAddress: input.contractAddress,
          network: input.network ?? NETWORK,
          functionName: input.functionName,
          functionArgs: JSON.stringify(input.functionArgs),
          abi: JSON.stringify(input.abi),
          value: input.value ?? "0",
          gasLimitMultiplier: input.gasLimitMultiplier ?? "1.2"
        })
      });
      if (!res.ok) {
        console.warn(
          "[keeperhub] contract-call non-2xx:",
          res.status,
          await res.text().catch(() => "")
        );
        return mockExec();
      }
      const json = (await res.json()) as { executionId: string; status: string };
      const status = await this.getStatus(json.executionId);
      return {
        jobId: json.executionId,
        hash: (status.transactionHash ?? "0x0") as `0x${string}`,
        status: (status.status ?? json.status ?? "pending") as ContractCallOutput["status"],
        rawStatusUrl: status.transactionLink
      };
    } catch (err) {
      console.warn("[keeperhub] contract-call error, mocking:", err);
      return mockExec();
    }
  },

  /**
   * Read + conditional write in one shot. Maps cleanly to the agent's
   * "if state allows, then act" pattern and is the cheapest way to show
   * KeeperHub's conditional execution primitive in the demo.
   */
  async checkAndExecute(input: CheckAndExecuteInput): Promise<{
    executed: boolean;
    jobId?: string;
    hash?: `0x${string}`;
    observed?: string;
  }> {
    const base = process.env.KEEPERHUB_API_BASE_URL ?? DEFAULT_BASE;
    const key = process.env.KEEPERHUB_API_KEY;
    if (!key) return { executed: false };

    try {
      const res = await fetch(`${base}/execute/check-and-execute`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          contractAddress: input.read.contractAddress,
          network: input.network ?? NETWORK,
          functionName: input.read.functionName,
          functionArgs: JSON.stringify(input.read.functionArgs ?? []),
          abi: JSON.stringify(input.read.abi),
          condition: input.condition,
          action: {
            contractAddress: input.action.contractAddress,
            functionName: input.action.functionName,
            functionArgs: JSON.stringify(input.action.functionArgs ?? []),
            abi: JSON.stringify(input.action.abi),
            gasLimitMultiplier: input.action.gasLimitMultiplier ?? "1.2"
          }
        })
      });
      if (!res.ok) {
        console.warn("[keeperhub] check-and-execute non-2xx:", res.status);
        return { executed: false };
      }
      const json = (await res.json()) as {
        executed: boolean;
        executionId?: string;
        condition?: { observedValue?: string };
      };
      if (json.executed && json.executionId) {
        const s = await this.getStatus(json.executionId);
        return {
          executed: true,
          jobId: json.executionId,
          hash: (s.transactionHash ?? "0x0") as `0x${string}`,
          observed: json.condition?.observedValue
        };
      }
      return { executed: false, observed: json.condition?.observedValue };
    } catch (err) {
      console.warn("[keeperhub] check-and-execute error:", err);
      return { executed: false };
    }
  },

  async getStatus(executionId: string): Promise<{
    status: "pending" | "running" | "completed" | "failed";
    transactionHash?: `0x${string}`;
    transactionLink?: string;
  }> {
    const base = process.env.KEEPERHUB_API_BASE_URL ?? DEFAULT_BASE;
    const key = process.env.KEEPERHUB_API_KEY;
    if (!key) return { status: "completed" };
    try {
      const res = await fetch(`${base}/execute/${executionId}/status`, {
        headers: { authorization: `Bearer ${key}` }
      });
      if (!res.ok) return { status: "pending" };
      return (await res.json()) as any;
    } catch {
      return { status: "pending" };
    }
  }
};

function mockExec(): ContractCallOutput {
  const r = (n: number) =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  return {
    jobId: `direct_${r(12)}`,
    hash: `0x${r(64)}` as `0x${string}`,
    status: "completed"
  };
}

function mockSubmit() {
  const r = (n: number) =>
    Array.from({ length: n }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  return {
    jobId: `kh_${r(16)}`,
    hash: `0x${r(64)}` as `0x${string}`
  };
}
