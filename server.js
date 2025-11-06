// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const bunyan = require('bunyan');
const CustomSplunkLogger = require('./custom-splunk-logger');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Load account data
const loadData = () => JSON.parse(fs.readFileSync('./data.json', 'utf8'));
const saveData = (data) => fs.writeFileSync('./data.json', JSON.stringify(data, null, 2));

// Messy logging setup
const logger1 = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[WINSTON] ${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()]
});

const logger2 = bunyan.createLogger({
  name: 'banking-app',
  level: 'debug'
});

const customLogger = new CustomSplunkLogger({
  source: 'banking-demo-app',
  sourcetype: 'banking:transaction',
  index: 'banking'
});

// Authentication middleware
app.use((req, res, next) => {
  if (req.path === '/login' || req.path === '/' || req.path.startsWith('/public')) {
    return next();
  }
  
  const sessionId = req.headers['x-session-id'];
  const data = loadData();
  
  if (!sessionId || !data.sessions[sessionId]) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  req.user = data.users[data.sessions[sessionId].userId];
  next();
});

// Routes with messy logging
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Overly complex logging
  logger1.info(`LOGIN ATTEMPT ${username} ${Date.now()}`);
  logger2.debug({msg: 'login_start', user: username, timestamp: new Date()});
  customLogger.log('BANKING_LOGIN_INITIATED', {username}, {ip: req.ip});
  console.log(`[AUDIT] Login attempt by ${username}`);
  
  const correlationId = `${username}-${Date.now()}-${Math.random()}`;
  
  logger1.info('validation_start');
  logger2.info('validating_credentials');
  customLogger.debug('CREDENTIAL_VALIDATION_PHASE_1');
  
  const data = loadData();
  const user = data.users[username];
  
  if (!user || user.password !== password) {
    logger1.error(`LOGIN FAILED ${username} INVALID_CREDENTIALS`);
    logger2.warn({msg: 'login_failed', user: username, reason: 'invalid_creds'});
    customLogger.log('BANKING_LOGIN_FAILED', {username}, {reason: 'INVALID_CREDENTIALS'});
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const sessionId = `session_${Date.now()}_${Math.random()}`;
  data.sessions[sessionId] = { userId: username, createdAt: new Date() };
  saveData(data);
  
  logger1.info(`LOGIN SUCCESS ${username} SESSION=${sessionId}`);
  logger2.info({msg: 'login_success', user: username, sessionId});
  customLogger.log('BANKING_LOGIN_SUCCESS', user, {sessionId, correlationId});
  console.log(`[AUDIT] Successful login ${username}`);
  
  res.json({ sessionId, user: { id: user.id, name: user.name, accounts: user.accounts } });
});

app.post('/transfer', (req, res) => {
  const { amount, toAccount, fromAccount = 'checking' } = req.body;
  
  logger1.info(`TRANSFER START ${req.user.id} ${Date.now()}`);
  logger2.debug({msg: 'transfer_init', user: req.user.id, time: new Date()});
  customLogger.log('BANKING_TRANSFER_INITIATED', req.user, req.body);
  console.log(`[AUDIT] Transfer by ${req.user.id}`);
  
  const correlationId = `${req.user.id}-${Date.now()}-${Math.random()}`;
  req.complexCorrelation = correlationId;
  
  logger1.info('validation_start');
  logger2.info('validating_request');
  customLogger.debug('REQUEST_VALIDATION_PHASE_1');
  
  if (!amount || amount <= 0) {
    logger1.error(`TRANSFER FAILED ${req.user.id} INVALID_AMOUNT`);
    return res.status(400).json({ error: 'Invalid amount' });
  }
  
  const data = loadData();
  const user = data.users[req.user.id];
  
  // Validate accounts exist
  if (!user.accounts || !user.accounts[fromAccount]) {
    return res.status(400).json({ error: 'Invalid source account' });
  }
  
  if (!user.accounts[toAccount]) {
    return res.status(400).json({ error: 'Invalid destination account' });
  }
  
  const fromAccountData = user.accounts[fromAccount];
  const toAccountData = user.accounts[toAccount];
  
  if (fromAccountData.balance < amount) {
    logger1.error(`TRANSFER FAILED ${req.user.id} INSUFFICIENT_FUNDS`);
    logger2.error({msg: 'insufficient_funds', user: req.user.id, requested: amount, available: fromAccountData.balance, account: fromAccount});
    return res.status(400).json({ error: 'Insufficient funds' });
  }
  
  // Perform the transfer
  fromAccountData.balance -= amount;
  toAccountData.balance += amount;
  
  data.transactions.push({
    id: `txn_${Date.now()}`,
    from: fromAccount,
    to: toAccount,
    userId: req.user.id,
    amount,
    timestamp: new Date(),
    correlationId
  });
  
  saveData(data);
  
  logger1.info(`TRANSFER SUCCESS ${req.user.id} AMOUNT=${amount} FROM=${fromAccount} TO=${toAccount}`);
  logger2.info({msg: 'transfer_complete', user: req.user.id, amount, fromAccount, toAccount, newBalance: fromAccountData.balance});
  customLogger.log('BANKING_TRANSFER_SUCCESS', req.user, {amount, fromAccount, toAccount, correlationId});
  console.log(`[AUDIT] Transfer completed ${req.user.id}: ${fromAccount} -> ${toAccount}: $${amount}`);
  
  res.json({ 
    success: true, 
    newBalance: fromAccountData.balance,
    toAccountName: toAccountData.displayName
  });
});

app.get('/balance', (req, res) => {
  const accountType = req.query.account || 'checking'; // Default to checking if not specified
  
  logger1.info(`BALANCE CHECK ${req.user.id} ACCOUNT=${accountType} ${Date.now()}`);
  logger2.debug({msg: 'balance_request', user: req.user.id, account: accountType});
  customLogger.log('BANKING_BALANCE_CHECK', req.user, {account: accountType});
  console.log(`[AUDIT] Balance check by ${req.user.id} for ${accountType}`);
  
  const data = loadData();
  const user = data.users[req.user.id];
  
  if (!user.accounts || !user.accounts[accountType]) {
    return res.status(400).json({ error: 'Invalid account type' });
  }
  
  const account = user.accounts[accountType];
  const balance = account.balance;
  const accountName = account.displayName;
  
  logger1.info(`BALANCE RESPONSE ${req.user.id} ACCOUNT=${accountType} BALANCE=${balance}`);
  logger2.info({msg: 'balance_response', user: req.user.id, account: accountType, balance});
  customLogger.log('BANKING_BALANCE_RESPONSE', req.user, {account: accountType, balance});
  
  res.json({ balance, accountName, accountType });
});

app.get('/transactions', (req, res) => {
  const { accountType, startDate, endDate } = req.query;
  
  logger1.info(`TRANSACTION HISTORY REQUEST ${req.user.id} ${Date.now()}`);
  logger2.debug({msg: 'transaction_history_request', user: req.user.id, filters: {accountType, startDate, endDate}});
  customLogger.log('BANKING_TRANSACTION_HISTORY', req.user, {accountType, startDate, endDate});
  console.log(`[AUDIT] Transaction history requested by ${req.user.id}`);
  
  const correlationId = `${req.user.id}-${Date.now()}-${Math.random()}`;
  
  logger1.info('loading_transactions');
  logger2.info('fetching_transaction_data');
  customLogger.debug('TRANSACTION_FETCH_PHASE_1');
  
  const data = loadData();
  let transactions = data.transactions.filter(txn => txn.userId === req.user.id);
  
  if (accountType) {
    logger1.info(`FILTERING BY ACCOUNT ${accountType}`);
    logger2.debug({msg: 'applying_account_filter', accountType});
    customLogger.debug(`FILTER_ACCOUNT_${accountType.toUpperCase()}`);
    
    transactions = transactions.filter(txn => 
      txn.from === accountType || txn.to === accountType
    );
  }
  
  if (startDate) {
    const start = new Date(startDate);
    logger1.info(`FILTERING BY START DATE ${startDate}`);
    logger2.debug({msg: 'applying_start_date_filter', startDate});
    customLogger.debug(`FILTER_START_DATE_${startDate}`);
    
    transactions = transactions.filter(txn => 
      new Date(txn.timestamp) >= start
    );
  }
  
  if (endDate) {
    const end = new Date(endDate);
    logger1.info(`FILTERING BY END DATE ${endDate}`);
    logger2.debug({msg: 'applying_end_date_filter', endDate});
    customLogger.debug(`FILTER_END_DATE_${endDate}`);
    
    transactions = transactions.filter(txn => 
      new Date(txn.timestamp) <= end
    );
  }
  
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  logger1.info(`TRANSACTION HISTORY SUCCESS ${req.user.id} COUNT=${transactions.length}`);
  logger2.info({msg: 'transaction_history_response', user: req.user.id, count: transactions.length, correlationId});
  customLogger.log('BANKING_TRANSACTION_HISTORY_SUCCESS', req.user, {count: transactions.length, correlationId});
  console.log(`[AUDIT] Transaction history returned ${transactions.length} transactions for ${req.user.id}`);
  
  res.json({ transactions });
});

app.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  
  logger1.info(`LOGOUT ${req.user.id} SESSION=${sessionId}`);
  logger2.debug({msg: 'logout_request', user: req.user.id, sessionId});
  customLogger.log('BANKING_LOGOUT', req.user, {sessionId});
  console.log(`[AUDIT] Logout by ${req.user.id}`);
  
  const data = loadData();
  delete data.sessions[sessionId];
  saveData(data);
  
  logger1.info(`LOGOUT SUCCESS ${req.user.id}`);
  logger2.info({msg: 'logout_complete', user: req.user.id});
  customLogger.log('BANKING_LOGOUT_SUCCESS', req.user, {});
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  logger1.info(`BANKING APP STARTED PORT=${PORT}`);
  logger2.info({msg: 'server_start', port: PORT});
  customLogger.log('BANKING_APP_STARTUP', {}, {port: PORT});
  console.log(`[SYSTEM] Banking demo server running on http://localhost:${PORT}`);
});
