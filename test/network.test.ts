import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_NETWORK,
  DEFAULT_RPC_URL,
  getNetworkFromSearchParams,
  getNetworkRpcUrl,
  isNetwork,
  normalizeNetwork,
} from "../lib/network";

test("isNetwork accepts supported values", () => {
  assert.equal(isNetwork("mainnet-beta"), true);
  assert.equal(isNetwork("testnet"), true);
  assert.equal(isNetwork("devnet"), true);
  assert.equal(isNetwork("invalid"), false);
});

test("normalizeNetwork falls back to mainnet-beta for invalid values", () => {
  assert.equal(normalizeNetwork("testnet"), "testnet");
  assert.equal(normalizeNetwork("invalid"), DEFAULT_NETWORK);
  assert.equal(normalizeNetwork(null), DEFAULT_NETWORK);
});

test("getNetworkRpcUrl returns the official Solana RPC URL for each network", () => {
  assert.equal(getNetworkRpcUrl("mainnet-beta"), DEFAULT_RPC_URL);
  assert.equal(getNetworkRpcUrl("testnet"), "https://api.testnet.solana.com");
  assert.equal(getNetworkRpcUrl("devnet"), "https://api.devnet.solana.com");
});

test("getNetworkFromSearchParams reads and normalizes network from the URL", () => {
  assert.equal(
    getNetworkFromSearchParams(
      new URLSearchParams("program=abc&network=testnet")
    ),
    "testnet"
  );
  assert.equal(
    getNetworkFromSearchParams(
      new URLSearchParams("program=abc&network=invalid")
    ),
    DEFAULT_NETWORK
  );
  assert.equal(
    getNetworkFromSearchParams(new URLSearchParams("program=abc")),
    DEFAULT_NETWORK
  );
});
