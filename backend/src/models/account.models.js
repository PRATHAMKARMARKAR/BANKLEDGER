import mongoose from "mongoose";
import ledgerModel from "./ledger.models.js"
const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User is required"],
        index: true,//search optimization
    },
    status: {
        type: String,
        enum: ["active", "inactive", "suspended"],
        message: "Invalid status. Please choose 'active', 'inactive', or 'suspended'.",
        default: "active",
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "INR"
    }
}, {
    timestamps: true

})

accountSchema.index({ user: 1, status: 1 })

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
        { $match: { account: this._id } },
        {
            $group:
            {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "debit"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "credit"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project:{
                _id: 0,
                balance: { $subtract:["$totalCredit","$totalDebit"]}
            }
        }
    ])
    if(balanceData.length === 0 ){
        return 0
    }
    return balanceData[0].balance
}


const accountModel = mongoose.model("account", accountSchema);

export default accountModel;