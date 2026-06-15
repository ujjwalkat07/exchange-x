import mongoose, { Schema, Document, Model } from "mongoose";
import {
  ApiErrorHandling,
  HttpCodes,
  accessTokenJwtSign,
  refreshTokenJwtSign,
  hashPassword,
  comparePassword,
} from "../../utils/utils-export";

interface IAuth extends Document {
  fullName: string;
  email: string;
  password: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
  GenrateAccessToken(): string;
  GenrateRefreshToken(): string;
  IsPasswordCorrect(password: string): Promise<boolean>;
}

const UserSchema: Schema<IAuth> = new Schema<IAuth>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

//do some stuff before saving password. it will convert plain password in random salt using bcrypt library . this function used mongoose inBuilt middleware hook 'pre' which is genrally used to do some stuff in data before saving in a database

UserSchema.pre<IAuth>("save", async function () {
  try {
    if (!this.isModified("password")) return;
    this.password = await hashPassword(this.password, 10);
  } catch (error) {
    const msg =
      error instanceof ApiErrorHandling ? error.message : String(error);
    throw new ApiErrorHandling(
      HttpCodes.INTERNAL_SERVER_ERROR,
      "Internal Server Error",
      [msg],
    );
  }
});

//this inbuilt function is used to create a custom own method, which further used in to check password and all

UserSchema.methods.IsPasswordCorrect = async function (password: string) {
  return await comparePassword(password, this.password);
};

// generate access and refresh token via mongoose inbuilt method generator, use this keyword to access
UserSchema.methods.GenrateAccessToken = function () {
  return accessTokenJwtSign({
    _id: this._id,
    email: this.email,
    fullName: this.fullName,
  });
};

UserSchema.methods.GenrateRefreshToken = function () {
  return refreshTokenJwtSign({
    _id: this._id,
  });
};
export const Auth: Model<IAuth> = mongoose.model<IAuth>("User", UserSchema);
