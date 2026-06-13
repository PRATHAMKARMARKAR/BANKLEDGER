import accountModel from "../models/account.models.js";
import { User } from "../models/user.models.js";

/**
 * CREATE ACCOUNT
 */
const createAccountController = async (req, res) => {
  try {
    const user = req.user;

    const account = await accountModel.create({
      user: user._id,
    });

    return res.status(201).json({
      message: "Account created successfully",
      account,
    });
  } catch (error) {
    console.error("Error creating account:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * GET USER ACCOUNTS
 */
const getUserAccountsController = async (req, res) => {
  try {
    const accounts = await accountModel.find({
      user: req.user._id,
    });

    return res.status(200).json({
      accounts,
    });
  } catch (error) {
    console.error("Error fetching accounts:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/**
 * GET ACCOUNT BALANCE
 */
const getAccountBalanceController = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
      accountId: account._id,
      balance,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export {
  createAccountController,
  getUserAccountsController,
  getAccountBalanceController,
};