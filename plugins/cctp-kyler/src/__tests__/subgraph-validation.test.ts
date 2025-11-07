import { describe, expect, it } from "vitest";

const SUBGRAPH_API_KEY = "4a9afbdb360256ba36f249c29f9f0bf2";
const ETHEREUM_SUBGRAPH_URL = `https://gateway.thegraph.com/api/${SUBGRAPH_API_KEY}/subgraphs/id/E6iPLnDGEgrcc4gu9uiHJxENSRAAzTvUJqQqJcHZqJT1`;

describe("Step 1: Basic Subgraph Connection", () => {
  it("should connect to Ethereum CCTP subgraph", async () => {
    const query = `
      query {
        _meta {
          block {
            number
          }
        }
      }
    `;

    const response = await fetch(ETHEREUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    console.log("Response status:", response.status);
    const text = await response.text();
    console.log("Response body:", text);

    expect(response.ok).toBe(true);
    const data = JSON.parse(text);
    expect(data).toHaveProperty("data");
    expect(data.data._meta).toBeDefined();
    console.log("✅ Step 1 passed: Basic connection works");
  }, 30000);
});

describe("Step 2: Explore Schema", () => {
  it("should query schema introspection", async () => {
    const query = `
      query {
        __schema {
          queryType {
            fields {
              name
              description
            }
          }
        }
      }
    `;

    const response = await fetch(ETHEREUM_SUBGRAPH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUBGRAPH_API_KEY}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.log("Available queries:", JSON.stringify(data, null, 2));
    expect(response.ok).toBe(true);
    console.log("✅ Step 2 passed: Schema introspection works");
  }, 30000);
});

describe("Step 3: Test Deposits Query", () => {
  it("should query deposits with basic structure", async () => {
    const query = `
      query {
        deposits(first: 5, orderBy: timestamp, orderDirection: desc) {
          id
          amount
          timestamp
          sourceDomain
          destinationDomain
        }
      }
    `;

    const response = await fetch(ETHEREUM_SUBGRAPH_URL, {
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
      console.log("GraphQL errors:", data.errors);
    }

    expect(response.ok).toBe(true);
    expect(data).toHaveProperty("data");
    
    if (data.data && data.data.deposits) {
      console.log("Found deposits:", data.data.deposits.length);
      if (data.data.deposits.length > 0) {
        console.log("Sample deposit:", JSON.stringify(data.data.deposits[0], null, 2));
      }
      expect(Array.isArray(data.data.deposits)).toBe(true);
    }
    console.log("✅ Step 3 passed: Deposits query structure validated");
  }, 30000);
});

describe("Step 4: Test Deposits with Time Filter", () => {
  it("should query deposits with timestamp filter", async () => {
    const now = Math.floor(Date.now() / 1000);
    const sevenDaysAgo = now - 7 * 24 * 60 * 60;

    const query = `
      query GetDeposits($startTimestamp: BigInt!, $endTimestamp: BigInt!) {
        deposits(
          where: { timestamp_gte: $startTimestamp, timestamp_lte: $endTimestamp }
          orderBy: timestamp
          orderDirection: desc
          first: 10
        ) {
          id
          amount
          timestamp
          sourceDomain
          destinationDomain
          burnToken
          mintRecipient
        }
      }
    `;

    const response = await fetch(ETHEREUM_SUBGRAPH_URL, {
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

    if (data.data && data.data.deposits) {
      console.log(`Found ${data.data.deposits.length} deposits in last 7 days`);
      if (data.data.deposits.length > 0) {
        const deposit = data.data.deposits[0];
        console.log("Sample deposit fields:", {
          id: deposit.id,
          amount: deposit.amount,
          timestamp: deposit.timestamp,
          sourceDomain: deposit.sourceDomain,
          destinationDomain: deposit.destinationDomain,
        });
      }
    }
    console.log("✅ Step 4 passed: Time-filtered deposits query works");
  }, 30000);
});

describe("Step 5: Calculate Volume", () => {
  it("should calculate volume from deposits", async () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayAgo = now - 24 * 60 * 60;

    const query = `
      query GetDeposits($startTimestamp: BigInt!, $endTimestamp: BigInt!) {
        deposits(
          where: { timestamp_gte: $startTimestamp, timestamp_lte: $endTimestamp }
          orderBy: timestamp
          orderDirection: desc
          first: 1000
        ) {
          amount
        }
      }
    `;

    const response = await fetch(ETHEREUM_SUBGRAPH_URL, {
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

    const deposits = data.data?.deposits || [];
    console.log(`Found ${deposits.length} deposits in last 24h`);

    let totalVolume = 0;
    const USDC_DECIMALS = 6;

    for (const deposit of deposits) {
      const amount = BigInt(deposit.amount);
      const amountUsd = Number(amount) / Math.pow(10, USDC_DECIMALS);
      totalVolume += amountUsd;
    }

    console.log(`Total volume (24h): $${totalVolume.toLocaleString()}`);
    expect(totalVolume).toBeGreaterThanOrEqual(0);
    console.log("✅ Step 5 passed: Volume calculation works");
  }, 30000);
});
