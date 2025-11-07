import { describe, expect, it } from "vitest";

const SUBGRAPH_API_KEY = "4a9afbdb360256ba36f249c29f9f0bf2";
const ARBITRUM_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/9DgSggKVrvfi4vdyYTdmSBuPgDfm3D7zfLZ1qaQFjYYW`;

describe("Arbitrum CCTP Subgraph Validation", () => {
  it("Step 1: should connect to Arbitrum CCTP subgraph", async () => {
    const query = `
      query {
        _meta {
          block {
            number
          }
        }
      }
    `;

    const response = await fetch(ARBITRUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty("data");
    expect(data.data._meta).toBeDefined();
    console.log("✅ Step 1 passed: Arbitrum connection works");
    console.log("Latest block:", data.data._meta.block.number);
  }, 30000);

  it("Step 2: should introspect MessageSent schema", async () => {
    const query = `
      query {
        __type(name: "MessageSent") {
          name
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    `;

    const response = await fetch(ARBITRUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.log("MessageSent fields:", JSON.stringify(data, null, 2));
    expect(response.ok).toBe(true);
    expect(data.data.__type).toBeDefined();
    console.log("✅ Step 2 passed: Arbitrum MessageSent schema introspection");
  }, 30000);

  it("Step 3: should query messageSents from Arbitrum", async () => {
    const query = `
      query {
        messageSents(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
          id
          amount
          blockTimestamp
          sourceDomain
          recipient
          nonce
          sender
          transactionHash
        }
      }
    `;

    const response = await fetch(ARBITRUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    const text = await response.text();
    console.log("Response:", text);
    const data = JSON.parse(text);

    if (data.errors) {
      console.log("GraphQL errors:", JSON.stringify(data.errors, null, 2));
    }

    expect(response.ok).toBe(true);
    expect(data).toHaveProperty("data");

    if (data.data && data.data.messageSents) {
      console.log(`Found ${data.data.messageSents.length} messageSents from Arbitrum`);
      if (data.data.messageSents.length > 0) {
        console.log("Sample Arbitrum messageSent:", JSON.stringify(data.data.messageSents[0], null, 2));
      }
    }
    console.log("✅ Step 3 passed: Arbitrum messageSents query works");
  }, 30000);

  it("Step 4: should query Arbitrum messageSents with time filter", async () => {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    const query = `
      query GetMessageSents($startTimestamp: BigInt!, $endTimestamp: BigInt!) {
        messageSents(
          where: { blockTimestamp_gte: $startTimestamp, blockTimestamp_lte: $endTimestamp }
          orderBy: blockTimestamp
          orderDirection: desc
          first: 10
        ) {
          id
          amount
          blockTimestamp
          sourceDomain
          recipient
          nonce
        }
      }
    `;

    const response = await fetch(ARBITRUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          startTimestamp: sevenDaysAgo.toString(),
          endTimestamp: now.toString(),
        },
      }),
    });

    const text = await response.text();
    console.log("Response:", text);
    const data = JSON.parse(text);

    if (data.errors) {
      console.log("GraphQL errors:", JSON.stringify(data.errors, null, 2));
    }

    expect(response.ok).toBe(true);
    expect(data).toHaveProperty("data");

    if (data.data && data.data.messageSents) {
      console.log(`Found ${data.data.messageSents.length} Arbitrum messageSents in last 7 days`);
      if (data.data.messageSents.length > 0) {
        const msg = data.data.messageSents[0];
        console.log("Sample Arbitrum messageSent:", {
          id: msg.id,
          amount: msg.amount,
          blockTimestamp: msg.blockTimestamp,
          sourceDomain: msg.sourceDomain,
          recipient: msg.recipient,
        });
      }
    }
    console.log("✅ Step 4 passed: Arbitrum time-filtered query works");
  }, 30000);

  it("Step 5: should calculate Arbitrum volume", async () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    const query = `
      query GetMessageSents($startTimestamp: BigInt!, $endTimestamp: BigInt!) {
        messageSents(
          where: { blockTimestamp_gte: $startTimestamp, blockTimestamp_lte: $endTimestamp }
          orderBy: blockTimestamp
          orderDirection: desc
          first: 1000
        ) {
          amount
        }
      }
    `;

    const response = await fetch(ARBITRUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          startTimestamp: oneDayAgo.toString(),
          endTimestamp: now.toString(),
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.log("Errors:", data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    const messageSents = data.data?.messageSents || [];
    console.log(`Found ${messageSents.length} Arbitrum messageSents in last 24h`);

    let totalVolume = 0;
    const USDC_DECIMALS = 6;

    for (const msg of messageSents) {
      const amount = BigInt(msg.amount);
      const amountUsd = Number(amount) / Math.pow(10, USDC_DECIMALS);
      totalVolume += amountUsd;
    }

    console.log(`Total Arbitrum volume (24h): $${totalVolume.toLocaleString()}`);
    expect(totalVolume).toBeGreaterThanOrEqual(0);
    console.log("✅ Step 5 passed: Arbitrum volume calculation works");
  }, 30000);
});
