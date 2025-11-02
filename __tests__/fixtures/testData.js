/**
 * Test data fixtures
 * These fixtures represent the expected data structure for tests
 */

const testUsers = {
  john_doe: {
    id: "john_doe",
    name: "John Doe",
    password: "password123",
    accounts: {
      checking: {
        accountNumber: "ACC-001",
        balance: 5000,
        type: "checking",
        displayName: "Checking Account"
      },
      savings: {
        accountNumber: "ACC-002",
        balance: 10000,
        type: "savings",
        displayName: "Savings Account"
      },
      investments: {
        accountNumber: "ACC-003",
        balance: 15000,
        type: "investments",
        displayName: "Investment Account"
      }
    }
  },
  jane_smith: {
    id: "jane_smith",
    name: "Jane Smith",
    password: "secure456",
    accounts: {
      checking: {
        accountNumber: "ACC-101",
        balance: 3000,
        type: "checking",
        displayName: "Checking Account"
      },
      savings: {
        accountNumber: "ACC-102",
        balance: 8000,
        type: "savings",
        displayName: "Savings Account"
      }
    }
  }
};

const testSessions = {
  "session_test_123": {
    userId: "john_doe",
    createdAt: new Date("2025-01-01T00:00:00.000Z")
  },
  "session_test_456": {
    userId: "jane_smith",
    createdAt: new Date("2025-01-01T00:00:00.000Z")
  }
};

const testTransactions = [
  {
    id: "txn_test_1",
    from: "checking",
    to: "savings",
    userId: "john_doe",
    amount: 1000,
    timestamp: new Date("2025-01-01T00:00:00.000Z"),
    correlationId: "test-correlation-1"
  }
];

const getTestData = () => ({
  users: JSON.parse(JSON.stringify(testUsers)),
  sessions: JSON.parse(JSON.stringify(testSessions)),
  transactions: JSON.parse(JSON.stringify(testTransactions))
});

module.exports = {
  testUsers,
  testSessions,
  testTransactions,
  getTestData
};
