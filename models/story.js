import { Schema, model, models } from "mongoose";

const WordUsedSchema = new Schema({
    german: {
        type: String,
        required: true
    },
    english: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'word'
    }
}, { _id: false });

const StoryPreferencesSchema = new Schema({
    length: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
    },
    style: {
        type: String,
        enum: ['educational', 'adventure', 'daily', 'funny', 'mystery'],
        default: 'educational'
    },
    includeEnglish: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const StorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, "User ID is required"],
            index: true
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"]
        },
        germanStory: {
            type: String,
            required: [true, "German story is required"],
            maxlength: [10000, "German story cannot exceed 10000 characters"]
        },
        englishStory: {
            type: String,
            required: [true, "English story is required"],
            maxlength: [10000, "English story cannot exceed 10000 characters"]
        },
        wordsUsed: {
            type: [WordUsedSchema],
            required: true,
            validate: {
                validator: function(words) {
                    return words && words.length > 0;
                },
                message: "At least one word must be used"
            }
        },
        preferences: {
            type: StoryPreferencesSchema,
            required: true
        },
        wordCount: {
            type: Number,
            default: function() {
                return this.wordsUsed ? this.wordsUsed.length : 0;
            }
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes for efficient querying
StorySchema.index({ userId: 1, createdAt: -1 });
StorySchema.index({ userId: 1, updatedAt: -1 });
StorySchema.index({ userId: 1, 'preferences.style': 1 });

// Virtual for story age
StorySchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const created = this.createdAt;
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMinutes = Math.floor(diffTime / (1000 * 60));
            return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const diffWeeks = Math.floor(diffDays / 7);
        return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else {
        return created.toLocaleDateString();
    }
});

// Static method to get user stories with pagination
StorySchema.statics.getUserStories = function(userId, page = 1, limit = 12, sortBy = 'createdAt', sortOrder = -1) {
    const skip = (page - 1) * limit;
    
    return this.find({ userId })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('title germanStory englishStory wordsUsed preferences createdAt updatedAt')
        .lean();
};

// Static method to get user story count
StorySchema.statics.getUserStoryCount = function(userId) {
    return this.countDocuments({ userId });
};

// Instance method to get story preview
StorySchema.methods.getPreview = function(language = 'german', maxLength = 150) {
    const story = language === 'german' ? this.germanStory : this.englishStory;
    
    if (!story) return '';
    
    // Remove markdown formatting for preview
    const cleanStory = story.replace(/\*\*(.*?)\*\*/g, '$1');
    
    if (cleanStory.length <= maxLength) {
        return cleanStory;
    }
    
    // Find the last complete sentence within the limit
    const truncated = cleanStory.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
        return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    // Fall back to word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > maxLength * 0.7 ? 
        truncated.substring(0, lastSpace) + '...' : 
        truncated + '...';
};

const Story = models.Story || model("Story", StorySchema);

export default Story;