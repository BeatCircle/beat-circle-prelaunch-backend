import mongoose from 'mongoose';
import crypto from 'crypto';

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true },
  },
  { timestamps: true }
);

// ─── Password helpers ───────────────────────────────────────────────────────

adminSchema.methods.setPassword = function (plainPassword) {
  this.passwordSalt = crypto.randomBytes(32).toString('hex');
  this.passwordHash = crypto
    .pbkdf2Sync(plainPassword, this.passwordSalt, 100_000, 64, 'sha512')
    .toString('hex');
};

adminSchema.methods.validatePassword = function (plainPassword) {
  const hash = crypto
    .pbkdf2Sync(plainPassword, this.passwordSalt, 100_000, 64, 'sha512')
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(this.passwordHash, 'hex'), Buffer.from(hash, 'hex'));
};

// Never expose hash / salt
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.passwordSalt;
  return obj;
};

export default mongoose.model('Admin', adminSchema);
