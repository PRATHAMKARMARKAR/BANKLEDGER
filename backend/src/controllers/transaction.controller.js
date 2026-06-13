import transactionModel from "../models/transaction.models.js";
import ledgerModel from "../models/ledger.models.js";
import accountModel from "../models/account.models.js";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

/**
 * CREATE TRANSACTION
 */export async function createTransaction(req, res) {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
    });
  }

  const fromUserAccount = await accountModel.findById(fromAccount);
  const toUserAccount = await accountModel.findById(toAccount);

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  const existingTransaction = await transactionModel.findOne({ idempotencyKey });

  if (existingTransaction) {
    return res.status(200).json({
      message: "Transaction already exists",
      transaction: existingTransaction,
    });
  }

  if (
    fromUserAccount.status.toLowerCase() !== "active" ||
    toUserAccount.status.toLowerCase() !== "active"
  ) {
    return res.status(400).json({
      message: "Both accounts must be active",
    });
  }

  const balance = await fromUserAccount.getBalance();

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current: ${balance}`,
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: "debit",   // ✅ FIXED
        },
      ],
      { session }
    );

    await new Promise((r) => setTimeout(r, 1500));

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "credit",  // ✅ FIXED
        },
      ],
      { session }
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: "Transaction successful",
      transaction,
    });
  } catch (error) {
    console.error("Transaction Error:", error);

    await session.abortTransaction();

    return res.status(500).json({
      message: "Transaction failed",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
}

/**
 * INITIAL FUND TRANSACTION
 */export async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idempotencyKey } = req.body;

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    });
  }

  const toUserAccount = await accountModel.findById(toAccount);

  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  // Find or create a dedicated system user representing the bank reserve
  let systemUser = await User.findOne({ username: "system" });
  if (!systemUser) {
    systemUser = await User.create({
      fullName: "System Bank Reserve",
      username: "system",
      email: "system@bank.ledger",
      password: "SystemSecurePassword123!",
    });
  }

  // Find or create system account for funding
  let fromUserAccount = await accountModel.findOne({
    user: systemUser._id,
  });

  if (!fromUserAccount) {
    fromUserAccount = await accountModel.create({
      user: systemUser._id,
      status: "active",
      currency: "INR",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const [transaction] = await transactionModel.create(
      [
        {
          fromAccount: fromUserAccount._id,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: fromUserAccount._id,
          amount,
          transaction: transaction._id,
          type: "debit",   // ✅ FIXED
        },
      ],
      { session }
    );

    await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "credit",  // ✅ FIXED
        },
      ],
      { session }
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      message: "Initial funds transaction successful",
      transaction,
    });
  } catch (error) {
    console.error("Initial Funds Error:", error);

    await session.abortTransaction();

    return res.status(500).json({
      message: "Failed to create initial funds transaction",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
}

/**
 * GET USER LEDGER ENTRIES
 */
export async function getUserLedger(req, res) {
  try {
    const accounts = await accountModel.find({ user: req.user._id });
    const accountIds = accounts.map(acc => acc._id);

    const ledgerEntries = await ledgerModel.find({
      account: { $in: accountIds }
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'transaction',
      populate: [
        { path: 'fromAccount', select: 'user status currency' },
        { path: 'toAccount', select: 'user status currency' }
      ]
    });

    return res.status(200).json({
      ledgerEntries,
    });
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
}