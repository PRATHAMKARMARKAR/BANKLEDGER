import { Router } from 'express'
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
import {
  createTransaction,
  createInitialFundsTransaction,
  getUserLedger,
} from "../controllers/transaction.controller.js"

router.route('/intialFunds').post(verifyJWT,createInitialFundsTransaction);
router.route('/fundsTransfer').post(verifyJWT,createTransaction);
router.route('/ledger').get(verifyJWT, getUserLedger);








export default router
