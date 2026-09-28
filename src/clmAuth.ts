import { JWTAuthToken } from './types';

let tokenCache: JWTAuthToken | null = null;

function base64UrlEncode(buffer: ArrayBuffer | string): string {
    let str = '';
    if (typeof buffer === 'string') {
        str = btoa(unescape(encodeURIComponent(buffer)));
    } else {
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            str += String.fromCharCode(bytes[i]);
        }
        str = btoa(str);
    }
    return str.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
    const cleanPem = pem
        .replace(/-----BEGIN RSA PRIVATE KEY-----/, '')
        .replace(/-----END RSA PRIVATE KEY-----/, '')
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s+/g, '');

    const binaryDer = atob(cleanPem);
    const buffer = new ArrayBuffer(binaryDer.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryDer.length; i++) {
        view[i] = binaryDer.charCodeAt(i);
    }
    return buffer;
}

async function signJwt(
    clientId: string,
    userId: string,
    privateKeyPem: string,
    authServerHost: string
): Promise<string> {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: clientId,
        sub: userId,
        iat: now,
        exp: now + 3600,
        aud: authServerHost,
        scope: 'spring_read spring_write content',
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const keyBuffer = pemToArrayBuffer(privateKeyPem);
    const cryptoKey = await window.crypto.subtle.importKey(
        'pkcs8',
        keyBuffer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: { name: 'SHA-256' },
        },
        false,
        ['sign']
    );

    const encoder = new TextEncoder();
    const signatureBuffer = await window.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        encoder.encode(unsignedToken)
    );

    const encodedSignature = base64UrlEncode(signatureBuffer);
    return `${unsignedToken}.${encodedSignature}`;
}

export async function getAccessToken(
    clientId: string,
    userId: string,
    privateKey: string,
    authServerHost: string = 'account.docusign.com'
): Promise<string> {
    const now = Date.now();

    if (
        tokenCache &&
        tokenCache.obtained_at + (tokenCache.expires_in - 300) * 1000 > now
    ) {
        return tokenCache.access_token;
    }

    const assertion = await signJwt(clientId, userId, privateKey, authServerHost);
    const tokenEndpoint = `https://${authServerHost}/oauth/token`;

    const bodyParams = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: assertion,
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DocuSign Auth Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    tokenCache = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
        obtained_at: Date.now(),
    };

    return tokenCache.access_token;
}