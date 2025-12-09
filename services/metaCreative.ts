
const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = 'https://graph.facebook.com';

export const uploadImage = async (adAccountId: string, file: File, token: string): Promise<{ hash: string; url: string }> => {
    const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    const formData = new FormData();
    formData.append('access_token', token);
    formData.append('filename', file);

    try {
        const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adimages`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.images) {
            // Meta returns map of { filename: { hash, url } }
            const key = Object.keys(data.images)[0];
            return data.images[key];
        }
        throw new Error("Image upload failed");
    } catch (e) {
        console.error("Ad Image upload error", e);
        throw e;
    }
};

export const createAdCreative = async (
    adAccountId: string,
    name: string,
    objectStorySpec: any,
    token: string
): Promise<string> => {
    const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    // Simplistic Create Creative
    const payload = {
        name,
        object_story_spec: objectStorySpec,
        access_token: token
    };

    try {
        const response = await fetch(`${BASE_URL}/${GRAPH_API_VERSION}/${formattedId}/adcreatives`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.id) return data.id;
        throw new Error(data.error?.message || "Creative creation failed");
    } catch (e) {
        console.error("Create ad creative error", e);
        throw e;
    }
};
