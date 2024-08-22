import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
    {
        email: {
            type: String,
            unique: [true, "Email already exists"],
            required: [true, "Email is required"],
        },
        name: {
            type: String,
            required: [true, "Name is required"],
        },
        password: {
            type: String,
            required: false,
        },
        image: {
            type: String,
        },
    },
    { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;
