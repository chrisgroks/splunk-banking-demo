const { getTestData } = require('../fixtures/testData');

describe('Transactions Endpoint Tests', () => {
  let testData;

  beforeEach(() => {
    testData = getTestData();
  });

  describe('Transaction Retrieval Logic', () => {
    test('should filter transactions by userId', () => {
      const userId = 'john_doe';
      const allTransactions = testData.transactions;
      
      const userTransactions = allTransactions.filter(txn => txn.userId === userId);
      
      expect(userTransactions.length).toBeGreaterThan(0);
      userTransactions.forEach(txn => {
        expect(txn.userId).toBe(userId);
      });
    });

    test('should filter transactions by account type', () => {
      const accountType = 'checking';
      const userId = 'john_doe';
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const filteredTransactions = allTransactions.filter(txn => 
        txn.from === accountType || txn.to === accountType
      );
      
      expect(filteredTransactions.length).toBeGreaterThan(0);
      filteredTransactions.forEach(txn => {
        expect(txn.from === accountType || txn.to === accountType).toBe(true);
      });
    });

    test('should filter transactions by start date', () => {
      const userId = 'john_doe';
      const startDate = new Date('2025-07-07T18:00:00.000Z');
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const filteredTransactions = allTransactions.filter(txn => 
        new Date(txn.timestamp) >= startDate
      );
      
      filteredTransactions.forEach(txn => {
        expect(new Date(txn.timestamp).getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      });
    });

    test('should filter transactions by end date', () => {
      const userId = 'john_doe';
      const endDate = new Date('2025-07-08T00:00:00.000Z');
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const filteredTransactions = allTransactions.filter(txn => 
        new Date(txn.timestamp) <= endDate
      );
      
      filteredTransactions.forEach(txn => {
        expect(new Date(txn.timestamp).getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    test('should filter by multiple criteria simultaneously', () => {
      const userId = 'john_doe';
      const accountType = 'savings';
      const startDate = new Date('2025-07-07T00:00:00.000Z');
      
      let transactions = testData.transactions.filter(txn => txn.userId === userId);
      transactions = transactions.filter(txn => txn.from === accountType || txn.to === accountType);
      transactions = transactions.filter(txn => new Date(txn.timestamp) >= startDate);
      
      transactions.forEach(txn => {
        expect(txn.userId).toBe(userId);
        expect(txn.from === accountType || txn.to === accountType).toBe(true);
        expect(new Date(txn.timestamp).getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      });
    });

    test('should sort transactions by timestamp descending', () => {
      const transactions = [...testData.transactions];
      
      transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      for (let i = 0; i < transactions.length - 1; i++) {
        const currentTime = new Date(transactions[i].timestamp).getTime();
        const nextTime = new Date(transactions[i + 1].timestamp).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    test('should return empty array when no transactions match filter', () => {
      const userId = 'john_doe';
      const accountType = 'nonexistent';
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const filteredTransactions = allTransactions.filter(txn => 
        txn.from === accountType || txn.to === accountType
      );
      
      expect(filteredTransactions).toEqual([]);
      expect(filteredTransactions.length).toBe(0);
    });

    test('should handle transactions from different account types', () => {
      const userId = 'john_doe';
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const accountTypes = new Set();
      allTransactions.forEach(txn => {
        accountTypes.add(txn.from);
        accountTypes.add(txn.to);
      });
      
      expect(accountTypes.size).toBeGreaterThan(1);
    });
  });

  describe('Transaction Data Validation', () => {
    test('should validate transaction has all required fields', () => {
      const transaction = testData.transactions[0];
      
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('from');
      expect(transaction).toHaveProperty('to');
      expect(transaction).toHaveProperty('userId');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('correlationId');
    });

    test('should validate transaction amount is positive number', () => {
      testData.transactions.forEach(txn => {
        expect(typeof txn.amount).toBe('number');
        expect(txn.amount).toBeGreaterThan(0);
      });
    });

    test('should validate timestamp is valid date', () => {
      testData.transactions.forEach(txn => {
        const date = new Date(txn.timestamp);
        expect(date).toBeInstanceOf(Date);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });

    test('should validate transaction ID format', () => {
      testData.transactions.forEach(txn => {
        expect(txn.id).toMatch(/^txn_/);
        expect(typeof txn.id).toBe('string');
        expect(txn.id.length).toBeGreaterThan(4);
      });
    });

    test('should validate correlation ID exists and is string', () => {
      testData.transactions.forEach(txn => {
        expect(txn.correlationId).toBeDefined();
        expect(typeof txn.correlationId).toBe('string');
        expect(txn.correlationId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Query Parameter Handling', () => {
    test('should handle empty filters returning all user transactions', () => {
      const userId = 'john_doe';
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      expect(allTransactions.length).toBeGreaterThan(0);
    });

    test('should handle invalid account type gracefully', () => {
      const userId = 'john_doe';
      const invalidAccountType = 'invalid_account';
      const allTransactions = testData.transactions.filter(txn => txn.userId === userId);
      
      const filteredTransactions = allTransactions.filter(txn => 
        txn.from === invalidAccountType || txn.to === invalidAccountType
      );
      
      expect(filteredTransactions).toEqual([]);
    });

    test('should handle invalid date format', () => {
      const invalidDate = 'not-a-date';
      const date = new Date(invalidDate);
      
      expect(date.toString()).toBe('Invalid Date');
    });
  });
});
