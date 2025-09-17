import { Schema, model, models } from "mongoose";
import crypto from "crypto";

const AudioCacheSchema = new Schema({
    textHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalText: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        default: 'de-DE'
    },
    audioData: {
        type: Buffer,
        required: true
    },
    audioFormat: {
        type: String,
        default: 'MP3'
    },
    voiceName: {
        type: String,
        default: 'de-DE-Standard-A'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    accessCount: {
        type: Number,
        default: 1
    }
});

// Static method to generate text hash
AudioCacheSchema.statics.generateHash = function(text, language = 'de-DE', voiceName = 'de-DE-Standard-A') {
    const content = `${text}|${language}|${voiceName}`;
    return crypto.createHash('sha256').update(content).digest('hex');
};

// Method to update access info
AudioCacheSchema.methods.updateAccess = function() {
    this.lastUsed = new Date();
    this.accessCount += 1;
    return this.save();
};

// Index for efficient cleanup of old entries
AudioCacheSchema.index({ lastUsed: 1 });
AudioCacheSchema.index({ createdAt: 1 });

const AudioCache = models.AudioCache || model('AudioCache', AudioCacheSchema);

export default AudioCache;