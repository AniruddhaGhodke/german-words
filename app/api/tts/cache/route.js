import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import AudioCache from "@/models/audioCache";

// GET - Get cache statistics
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language');
        const details = searchParams.get('details') === 'true';

        // Build query
        let query = {};
        if (language) {
            query.language = language;
        }

        // Get basic stats
        const [totalEntries, totalSize, recentEntries] = await Promise.all([
            AudioCache.countDocuments(query),
            AudioCache.aggregate([
                { $match: query },
                { $group: { _id: null, totalSize: { $sum: { $binarySize: "$audioData" } } } }
            ]),
            AudioCache.find(query)
                .select('originalText language voiceName createdAt lastUsed accessCount')
                .sort({ lastUsed: -1 })
                .limit(10)
                .lean()
        ]);

        const stats = {
            totalEntries,
            totalSizeBytes: totalSize[0]?.totalSize || 0,
            totalSizeMB: Math.round((totalSize[0]?.totalSize || 0) / 1024 / 1024 * 100) / 100
        };

        if (details) {
            // Get additional detailed stats
            const [languageStats, accessStats, oldEntries] = await Promise.all([
                // Group by language
                AudioCache.aggregate([
                    { $match: query },
                    { $group: {
                        _id: "$language",
                        count: { $sum: 1 },
                        totalSize: { $sum: { $binarySize: "$audioData" } },
                        avgAccess: { $avg: "$accessCount" }
                    }},
                    { $sort: { count: -1 } }
                ]),
                // Access frequency stats
                AudioCache.aggregate([
                    { $match: query },
                    { $group: {
                        _id: null,
                        totalAccesses: { $sum: "$accessCount" },
                        avgAccesses: { $avg: "$accessCount" },
                        maxAccesses: { $max: "$accessCount" }
                    }}
                ]),
                // Old entries (older than 30 days)
                AudioCache.countDocuments({
                    ...query,
                    createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                })
            ]);

            stats.languageBreakdown = languageStats;
            stats.accessStats = accessStats[0] || { totalAccesses: 0, avgAccesses: 0, maxAccesses: 0 };
            stats.oldEntries = oldEntries;
            stats.recentEntries = recentEntries;
        }

        return NextResponse.json({
            success: true,
            data: {
                ...stats,
                message: `Found ${totalEntries} cached audio entries`
            }
        });

    } catch (error) {
        console.error("Cache stats error:", error);
        return NextResponse.json(
            { error: "Failed to get cache statistics" },
            { status: 500 }
        );
    }
}

// DELETE - Clean up old cache entries
export async function DELETE(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const olderThanDays = parseInt(searchParams.get('olderThan')) || 30;
        const language = searchParams.get('language');
        const accessThreshold = parseInt(searchParams.get('accessThreshold')) || 0;

        // Build deletion query
        let query = {};

        if (olderThanDays > 0) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
            query.createdAt = { $lt: cutoffDate };
        }

        if (language) {
            query.language = language;
        }

        if (accessThreshold > 0) {
            query.accessCount = { $lte: accessThreshold };
        }

        // Get size before deletion
        const sizeBefore = await AudioCache.aggregate([
            { $match: query },
            { $group: { _id: null, totalSize: { $sum: { $binarySize: "$audioData" } } } }
        ]);

        const result = await AudioCache.deleteMany(query);

        return NextResponse.json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                freedSizeBytes: sizeBefore[0]?.totalSize || 0,
                freedSizeMB: Math.round((sizeBefore[0]?.totalSize || 0) / 1024 / 1024 * 100) / 100,
                criteria: {
                    olderThanDays,
                    language: language || 'all',
                    accessThreshold: accessThreshold || 'none'
                },
                message: `Cleaned up ${result.deletedCount} cache entries`
            }
        });

    } catch (error) {
        console.error("Cache cleanup error:", error);
        return NextResponse.json(
            { error: "Cache cleanup failed" },
            { status: 500 }
        );
    }
}