import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    restaurantId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Restaurant", 
      required: true 
    },
    restaurantManagerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    plan: { 
      type: String, 
      enum: ['basic', 'premium'], 
      required: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'cancelled'], 
      default: 'pending' 
    },
    paymentDate: { 
      type: Date 
    },
    expiryDate: { 
      type: Date 
    },
    paymentMethod: { 
      type: String 
    },
    transactionId: { 
      type: String 
    }
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;

