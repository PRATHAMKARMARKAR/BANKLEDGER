import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Account is required"],
        immutable: true, //ledger entry should not be changed once created
    }, 
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Transaction is required"],
        index: true,//search optimization
        immutable: true, //ledger entry should not be changed once created
    },
    type: {
        type: String, 
        enum: ["debit", "credit"],
        message: "Invalid type. Please choose 'debit' or 'credit'.",
        required: [true, "Type is required"],
        immutable: true, //ledger entry should not be changed once created  
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount must be a positive number"],
        immutable: true, //ledger entry should not be changed once created
    }
})


function preventLedgerModification() {
    throw new Error("Ledger entries cannot be modified once created")
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification)
ledgerSchema.pre('updateOne', preventLedgerModification)
ledgerSchema.pre('updateMany', preventLedgerModification)
ledgerSchema.pre('deleteOne', preventLedgerModification)
ledgerSchema.pre('deleteMany', preventLedgerModification)
ledgerSchema.pre('remove', preventLedgerModification)
ledgerSchema.pre('findOneAndDelete', preventLedgerModification)
ledgerSchema.pre('findOneAndRemove', preventLedgerModification)
ledgerSchema.pre('findOneAndReplace', preventLedgerModification)

const ledgerModel = mongoose.model("ledger", ledgerSchema);

export default ledgerModel;