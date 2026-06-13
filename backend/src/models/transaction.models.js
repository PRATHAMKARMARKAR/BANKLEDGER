import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "From account is required"],
        index: true,//search optimization
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "To account is required"],
        index: true,//search optimization
    },
    status: {
        type: String,
        enum: ["PENDING", "COMPLETED", "FAILED", "REVERSE"],
        message: "Invalid status. Please choose 'pending', 'completed', or 'failed'.",
        default: "pending",
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount must be a positive number"],       
    },
    idempotencyKey: {
        type: String,
        required: [true, "Idempotency key is required"],
        unique: true,
    }
}, {
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema);

export default transactionModel;