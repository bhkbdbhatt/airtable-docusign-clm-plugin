export interface FieldMapping {
    airtableFieldId: string;
    clmFieldName: string;
}

export interface ExtensionSettings {
    accountId: string;
    clientId: string;
    userId: string;
    privateKey: string;
    baseUrl: string;
    workflowId: string;
    contractIdFieldId: string;
    fieldMappings: FieldMapping[];
}

export interface CLMWorkflowTaskResponse {
    id: string;
    status: string;
    documentId?: string;
}

export interface JWTAuthToken {
    access_token: string;
    expires_in: number;
    token_type: string;
    obtained_at: number;
}