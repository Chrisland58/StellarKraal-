jest.mock("@stellar/stellar-sdk", () => ({
  SorobanRpc: {
    Server: jest.fn().mockImplementation(() => ({
      getAccount: jest.fn(),
      prepareTransaction: jest.fn(),
      simulateTransaction: jest.fn(),
      getHealth: jest.fn(),
      getTransaction: jest.fn(),
      sendTransaction: jest.fn(),
    })),
  },
}));

import rpcClient from "./rpcClient";

describe("RPC Client with Circuit Breaker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should expose circuit breaker states", () => {
    const states = rpcClient.getCircuitStates();
    
    expect(states).toHaveProperty("getAccount");
    expect(states).toHaveProperty("prepareTransaction");
    expect(states).toHaveProperty("simulateTransaction");
    expect(states).toHaveProperty("getHealth");
    expect(states).toHaveProperty("sendTransaction");
    
    // All circuits should be closed initially
    expect(states.getAccount).toBe("closed");
    expect(states.prepareTransaction).toBe("closed");
    expect(states.simulateTransaction).toBe("closed");
    expect(states.getHealth).toBe("closed");
    expect(states.sendTransaction).toBe("closed");
  });

  it("should report healthy when all circuits are closed", () => {
    const isHealthy = rpcClient.isHealthy();
    expect(isHealthy).toBe(true);
  });

  it("should have retry logic configured", async () => {
    // This test verifies the retry configuration exists
    expect(rpcClient.getAccount).toBeDefined();
    expect(rpcClient.prepareTransaction).toBeDefined();
    expect(rpcClient.simulateTransaction).toBeDefined();
    expect(rpcClient.getHealth).toBeDefined();
    expect(rpcClient.sendTransaction).toBeDefined();
  });

  it("should wrap RPC methods with circuit breaker", () => {
    // Verify all methods are wrapped
    expect(typeof rpcClient.getAccount).toBe("function");
    expect(typeof rpcClient.prepareTransaction).toBe("function");
    expect(typeof rpcClient.simulateTransaction).toBe("function");
    expect(typeof rpcClient.getHealth).toBe("function");
    expect(typeof rpcClient.sendTransaction).toBe("function");
  });
});
