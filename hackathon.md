# Hackathon Build Plan

## Sponsors & Prize Pools

- 0G — $15,000 (two tracks of $7,500)
- Uniswap Foundation — $5,000
- Gensyn (AXL) — $5,000
- ENS — $5,000
- KeeperHub — $5,000

Total available: $35,000.

## Recommended Build: AgentMesh

A peer-to-peer swarm of autonomous DeFi agents that live as iNFTs on 0G, talk over Gensyn AXL, are identified by ENS subnames, trade through the Uniswap API, and settle every onchain action through KeeperHub.

One project, designed from the start to qualify across all five sponsors. The pitch is coherent — not a checklist — because each integration solves a real problem the others create:

- Multi-agent swarms need identity → ENS gives every agent a `<name>.agentmesh.eth`.
- Swarms need trustless P2P comms → AXL replaces the central message broker.
- Agents need persistent brains and ownership → 0G Storage for memory, 0G Compute for inference, iNFTs (ERC-7857) for ownership and royalties.
- Agents need to actually trade → Uniswap API for swaps and quotes.
- Agents need reliable execution → KeeperHub for retries, gas handling, MEV protection.

## The Swarm

Four specialist agents, each minted as an iNFT on 0G:

1. Analyst — pulls market data, runs sealed inference on 0G Compute (Qwen3.6-plus / GLM-5-FP8) for signal generation. Memory in 0G Storage Log.
2. Researcher — long-running web/onchain research with self-reflection. Memory in 0G Storage KV.
3. Risk Manager — gates proposed trades against position limits, drawdown rules, slippage budgets. Vetoes via AXL.
4. Executor — receives approved trades, gets quotes from Uniswap API, submits via KeeperHub for guaranteed execution and audit trail.

Agents coordinate over AXL using A2A messages. No central server. Each agent runs as its own AXL node and talks to localhost.

## Sponsor-by-Sponsor Coverage

### 0G — Best Autonomous Agents, Swarms & iNFT Innovations ($7,500 track)
- Mint each agent as an ERC-7857 iNFT on 0G Chain.
- Encrypted agent intelligence (system prompt, tools, weights pointer) embedded in iNFT metadata, stored on 0G Storage.
- Persistent memory: KV for live state (positions, balances), Log for conversation/decision history.
- Sealed inference on 0G Compute for verifiable reasoning.
- Royalty splits on iNFT usage when other users rent the swarm.

### 0G — Best Agent Framework track ($7,500)
- Ship a small open-source library, "ClawSwarm," that anyone can use to spin up similar swarms: pluggable memory backends (0G KV / Log), swappable LLM backends (0G Compute / others), AXL transport baked in, ENS identity baked in, KeeperHub execution baked in.
- Include the AgentMesh swarm as the reference example agent built on the framework.
- This single library lets us submit credibly to BOTH 0G tracks (framework + agents-built-with-it).

### Uniswap — Best API Integration ($5,000)
- Executor agent uses Uniswap API for quotes, swaps, and settlement on Unichain or Ethereum.
- Multi-agent context is novel: agents negotiate, then settle atomically.
- Include the required FEEDBACK.md with a real builder report.

### Gensyn — Best AXL Application ($5,000)
- All inter-agent comms go over AXL — across separate nodes, not in-process. This is a hard requirement.
- Use AXL's MCP and A2A built-ins for structured messages between roles.
- Encrypted by default — a real fit since the swarm is exchanging trade intent.

### ENS — Both tracks ($5,000)
- Best ENS for AI Agents: each agent has `analyst.agentmesh.eth`, `executor.agentmesh.eth`, etc. Resolves to the agent's address. Text records hold capability manifests, AXL peer ID, and reputation score.
- Most Creative Use: subnames double as access tokens — to delegate to the swarm, you mint a subname under your own ENS that the agents read to scope permissions. Auto-rotating ephemeral subnames per trade for privacy.

### KeeperHub — Best Use ($4,500) + Feedback Bounty ($250)
- Executor agent talks to KeeperHub via MCP for every onchain write.
- Uses x402 / MPP for autonomous agent payment of execution fees.
- Submit honest, specific FEEDBACK.md for the bounty.

## Why This Wins

- One integrated demo video shows agents discovering each other via ENS, negotiating over AXL, reasoning on 0G Compute, deciding, and executing a Uniswap swap through KeeperHub — all visibly P2P with persistent state.
- Every sponsor sees their tech as load-bearing, not bolted on.
- The framework-vs-agent split lets us submit to both 0G tracks without it feeling forced.

## Realistic Prize Math

Even hitting mid-tier placements across sponsors is meaningful:

- 0G framework 3rd-5th: $500–$1,500
- 0G agents (one of five): $1,500
- Uniswap 2nd–3rd: $1,000–$1,500
- AXL 2nd–3rd: $1,000–$1,500
- ENS one track 2nd: $750
- KeeperHub 2nd–3rd + feedback: $750–$1,750

Conservative range: $5,500–$8,500. Top placements push toward $15k+.

## Build Order (Time-Boxed)

1. Scaffold ClawSwarm framework (memory adapters, LLM adapter, AXL transport stub).
2. Stand up 0G Storage + Compute connections, get one agent reasoning end-to-end.
3. Wire AXL between two agents on separate nodes. Verify cross-node messaging.
4. Add ENS subname registration + resolution for each agent.
5. Mint iNFTs on 0G Chain with encrypted-metadata pointer to 0G Storage.
6. Plug Uniswap API into Executor; dry-run quotes.
7. Plug KeeperHub MCP into Executor for actual onchain settlement.
8. Add Risk Manager veto path; record full decision trail in 0G Storage Log.
9. Build minimal web UI showing live swarm chatter, ENS identities, and trade history.
10. Record sub-3-min demo. Write READMEs, FEEDBACK.md (Uniswap + KeeperHub), architecture diagram.

## Submission Checklist

- Public GitHub repo with README and setup instructions.
- Architecture diagram showing 0G + AXL + ENS + Uniswap + KeeperHub.
- Contract deployment addresses (iNFT contract, any helpers).
- iNFT minted on 0G explorer with proof of embedded intelligence/memory.
- Demo video under 3 minutes plus a live demo link.
- FEEDBACK.md (Uniswap track requires it; KeeperHub bounty needs specific actionable feedback).
- Team names, Telegram, X handles.
- Working example agent built on the framework (the AgentMesh swarm itself).
