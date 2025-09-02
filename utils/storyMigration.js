// Utility to migrate stories from localStorage to MongoDB
export const migrateLocalStorageStories = async () => {
    try {
        // Check if we're in the browser
        if (typeof window === 'undefined') return null;
        
        const savedStories = localStorage.getItem('savedStories');
        if (!savedStories) return null;
        
        const stories = JSON.parse(savedStories);
        if (!Array.isArray(stories) || stories.length === 0) return null;
        
        console.log(`Found ${stories.length} stories in localStorage, migrating...`);
        
        let migrated = 0;
        let failed = 0;
        
        for (const story of stories) {
            try {
                // Transform localStorage story format to API format
                const storyToMigrate = {
                    title: story.title || `Migrated story with ${story.selectedWords?.length || 0} words`,
                    germanStory: story.germanStory,
                    englishStory: story.englishStory,
                    wordsUsed: story.selectedWords || [],
                    preferences: {
                        length: 'medium',
                        style: 'educational',
                        includeEnglish: true,
                        ...story.preferences
                    }
                };
                
                const response = await fetch('/api/stories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(storyToMigrate)
                });
                
                if (response.ok) {
                    migrated++;
                } else {
                    failed++;
                    console.error(`Failed to migrate story: ${story.title}`);
                }
            } catch (error) {
                failed++;
                console.error('Error migrating story:', error);
            }
        }
        
        if (migrated > 0) {
            // Clear localStorage after successful migration
            localStorage.removeItem('savedStories');
            console.log(`Successfully migrated ${migrated} stories. Cleared localStorage.`);
        }
        
        return { migrated, failed, total: stories.length };
    } catch (error) {
        console.error('Error during migration:', error);
        return null;
    }
};

export const hasLocalStorageStories = () => {
    if (typeof window === 'undefined') return false;
    
    const savedStories = localStorage.getItem('savedStories');
    if (!savedStories) return false;
    
    try {
        const stories = JSON.parse(savedStories);
        return Array.isArray(stories) && stories.length > 0;
    } catch {
        return false;
    }
};