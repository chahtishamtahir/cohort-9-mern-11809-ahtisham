const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'General',
      trim: true
    },
    is_pinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual id
noteSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Note = mongoose.model('Note', noteSchema);
module.exports = Note;
