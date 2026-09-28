import { getAccessToken } from './clmAuth';
import { ExtensionSettings, CLMWorkflowTaskResponse } from './types';

export class CLMClient {
    private settings: ExtensionSettings;

    constructor(settings: ExtensionSettings) {
        this.settings = settings;
    }

    public async startWorkflow(
        recordData: Record<string, unknown>
    ): Promise<CLMWorkflowTaskResponse> {
        const token = await getAccessToken(
            this.settings.clientId,
            this.settings.userId,
            this.settings.privateKey
        );

        const url = `${this.settings.baseUrl}/v2/${this.settings.accountId}/workflows/${this.settings.workflowId}/tasks`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ Params: recordData }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`CLM Workflow Error (${response.status}): ${err}`);
        }

        return (await response.json()) as CLMWorkflowTaskResponse;
    }

    public async getDocumentBlobUrl(documentId: string): Promise<string> {
        const token = await getAccessToken(
            this.settings.clientId,
            this.settings.userId,
            this.settings.privateKey
        );

        const url = `${this.settings.baseUrl}/content/v2/${this.settings.accountId}/documents/${documentId}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/pdf',
            },
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`CLM Document Fetch Error (${response.status}): ${err}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }
}