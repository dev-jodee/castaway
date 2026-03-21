export const MINIMAL_SOLANA_IDL = {
  address: "11111111111111111111111111111111",
  metadata: {
    name: "counter",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "increment",
      discriminator: [11, 18, 104, 9, 104, 174, 59, 33],
      accounts: [],
      args: [],
    },
  ],
  accounts: [],
  types: [],
} as const;
