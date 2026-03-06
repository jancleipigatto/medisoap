import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ICD11_CLIENT_ID = "47cedd1c-6f70-49e3-9505-9e6542b72789_07d6b3ac-9b16-402d-90d8-4359cd5889db";
const ICD11_CLIENT_SECRET = "1EVMLYaj/InBH96BZ0hckTifArinRR8Bgvu6FpCSS28=";
const TOKEN_ENDPOINT = "https://icdaccessmanagement.who.int/connect/token";

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", "icdapi_access");
    params.append("client_id", ICD11_CLIENT_ID);
    params.append("client_secret", ICD11_CLIENT_SECRET);

    const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { query, language = "pt" } = body;

        if (!query || query.trim().length < 2) {
            return Response.json({ results: [] });
        }

        const token = await getToken();

        const searchUrl = `https://id.who.int/icd/entity/search?q=${encodeURIComponent(query)}&useFlexisearch=false&flatResults=true&highlightingEnabled=false&chapterFilter=&subtreeFilterUsesFoundationDescendants=false&includeKeywordResult=true&medicalCodingMode=true`;

        const response = await fetch(searchUrl, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json",
                "Accept-Language": language,
                "API-Version": "v2",
            },
        });

        if (!response.ok) {
            return Response.json({ error: `ICD API error: ${response.status}` }, { status: 500 });
        }

        const data = await response.json();

        const results = (data.destinationEntities || []).map(entity => ({
            id: entity.id,
            code: entity.theCode || "",
            title: entity.title || "",
            definition: entity.definition || "",
            isLeaf: entity.isLeaf,
        }));

        return Response.json({ results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});