import { NextResponse } from "next/server";
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { connectDB } from "@/utils/db";
import AudioCache from "@/models/audioCache";

// Initialize Google Cloud Text-to-Speech client
let client;

try {
    // Create credentials object
    const credentials = {
        type: "service_account",
        project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_id: "",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };

    client = new TextToSpeechClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: credentials,
    });
} catch (error) {
    console.error("Failed to initialize Google Cloud TTS client:", error);
}

// POST - Synthesize text to speech with caching
export async function POST(request) {
    try {
        // Check if client is initialized
        if (!client) {
            return NextResponse.json(
                { error: "Google Cloud TTS client not initialized" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { text, language = 'de-DE', voiceName = 'de-DE-Standard-A', speakingRate = 1.0 } = body;

        // Validate input
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return NextResponse.json(
                { error: "Text is required and must be a non-empty string" },
                { status: 400 }
            );
        }

        if (text.length > 5000) {
            return NextResponse.json(
                { error: "Text too long (max 5000 characters)" },
                { status: 400 }
            );
        }

        await connectDB();

        // Generate hash for caching (include speaking rate in hash)
        const textHash = AudioCache.generateHash(text.trim(), language, `${voiceName}_${speakingRate}`);

        // Check cache first
        let cachedAudio = await AudioCache.findOne({ textHash });

        if (cachedAudio) {
            console.log('Cache hit for text:', text.substring(0, 50) + '...');

            // Update access info
            await cachedAudio.updateAccess();

            return new NextResponse(cachedAudio.audioData, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': 'inline',
                    'X-Cache-Status': 'HIT',
                    'X-Audio-Format': cachedAudio.audioFormat,
                    'X-Voice-Name': cachedAudio.voiceName,
                },
            });
        }

        console.log('Cache miss - generating new audio for:', text.substring(0, 50) + '...');

        // Cache miss - generate new audio using Google Cloud TTS
        const request_config = {
            input: { text: text.trim() },
            voice: {
                languageCode: language,
                name: voiceName,
                ssmlGender: voiceName.includes('Standard-A') || voiceName.includes('Standard-C') ? 'FEMALE' : 'MALE',
            },
            audioConfig: {
                audioEncoding: 'MP3',
                speakingRate: Math.max(0.25, Math.min(4.0, speakingRate)), // Clamp between 0.25x and 4.0x
                pitch: 0.0,
                volumeGainDb: 0.0,
                sampleRateHertz: 24000,
            },
        };

        const [response] = await client.synthesizeSpeech(request_config);
        const audioData = Buffer.from(response.audioContent);

        // Store in cache
        const newCacheEntry = new AudioCache({
            textHash,
            originalText: text.trim(),
            language,
            audioData,
            audioFormat: 'MP3',
            voiceName,
        });

        try {
            await newCacheEntry.save();
            console.log('Audio cached successfully');
        } catch (cacheError) {
            console.warn('Failed to cache audio (non-blocking):', cacheError.message);
            // Continue even if caching fails
        }

        return new NextResponse(audioData, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': 'inline',
                'X-Cache-Status': 'MISS',
                'X-Audio-Format': 'MP3',
                'X-Voice-Name': voiceName,
            },
        });

    } catch (error) {
        console.error("TTS synthesis error:", error);

        // Check if it's a Google Cloud API error
        if (error.code === 3) { // INVALID_ARGUMENT
            return NextResponse.json(
                { error: "Invalid text or voice parameters" },
                { status: 400 }
            );
        }

        if (error.code === 16) { // UNAUTHENTICATED
            return NextResponse.json(
                { error: "Google Cloud authentication failed" },
                { status: 500 }
            );
        }

        if (error.code === 8) { // RESOURCE_EXHAUSTED
            return NextResponse.json(
                { error: "TTS quota exceeded" },
                { status: 429 }
            );
        }

        return NextResponse.json(
            {
                error: "Text-to-speech synthesis failed",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}

// GET - Check TTS service status and available voices
export async function GET(request) {
    try {
        // Check if client is initialized
        if (!client) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Google Cloud TTS client not initialized",
                    details: process.env.NODE_ENV === 'development' ?
                        "Check your Google Cloud credentials in environment variables" :
                        "TTS service configuration error"
                },
                { status: 503 }
            );
        }

        const { searchParams } = new URL(request.url);
        const language = searchParams.get('language') || 'de-DE';

        // Test Google Cloud TTS connection by listing voices
        const [result] = await client.listVoices({
            languageCode: language
        });

        const voices = result.voices || [];
        const germanVoices = voices.filter(voice =>
            voice.languageCodes.some(code => code.startsWith('de'))
        );

        return NextResponse.json({
            success: true,
            data: {
                status: "TTS service is operational",
                availableVoices: germanVoices.length,
                recommendedVoice: 'de-DE-Standard-A',
                supportedLanguages: ['de-DE', 'en-US'],
                voices: germanVoices.slice(0, 10), // Return first 10 voices
            }
        });

    } catch (error) {
        console.error("TTS status check error:", error);

        return NextResponse.json(
            {
                success: false,
                error: "TTS service unavailable",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 503 }
        );
    }
}

// DELETE - Clear cache (for maintenance)
export async function DELETE(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const olderThan = searchParams.get('olderThan'); // days
        const language = searchParams.get('language');

        let query = {};

        if (olderThan) {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThan));
            query.createdAt = { $lt: cutoffDate };
        }

        if (language) {
            query.language = language;
        }

        const result = await AudioCache.deleteMany(query);

        return NextResponse.json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                message: `Cleared ${result.deletedCount} cached audio entries`
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