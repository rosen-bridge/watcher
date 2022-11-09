import { Transaction } from './Transaction';

/**
 * TransactionTest class used for testing Transaction class
 */
class TransactionTest extends Transaction {
  /**
   * Reset function to reset the singleton instance of the class
   */
  static reset = () => {
    Transaction.isSetupCalled = false;
    Transaction.instance = undefined;
  };
}

export default TransactionTest;
