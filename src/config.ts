import { globalConfig } from '@airtable/blocks';
import { ExtensionSettings, FieldMapping } from './types';

const CONFIG_KEYS = {
    ACCOUNT_ID: 'docusign_account_id',
    CLIENT_ID: 'docusign_client_id',
    USER_ID: 'docusign_user_id',
    PRIVATE_KEY: 'docusign_private_key',
    BASE_URL: 'docusign_base_url',
    WORKFLOW_ID: 'docusign_workflow_id',
    CONTRACT_ID_FIELD: 'docusign_contract_id_field',
    FIELD_MAPPINGS: 'docusign_field_mappings',
};

export function loadSettings(): ExtensionSettings {
    return {
        accountId: (globalConfig.get(CONFIG_KEYS.ACCOUNT_ID) as string) || '',
        clientId: (globalConfig.get(CONFIG_KEYS.CLIENT_ID) as string) || '',
        userId: (globalConfig.get(CONFIG_KEYS.USER_ID) as string) || '',
        privateKey: (globalConfig.get(CONFIG_KEYS.PRIVATE_KEY) as string) || '',
        baseUrl:
            (globalConfig.get(CONFIG_KEYS.BASE_URL) as string) ||
            'https://api.na21.clm.docusign.net',
        workflowId: (globalConfig.get(CONFIG_KEYS.WORKFLOW_ID) as string) || '',
        contractIdFieldId:
            (globalConfig.get(CONFIG_KEYS.CONTRACT_ID_FIELD) as string) || '',
        fieldMappings:
            (globalConfig.get(CONFIG_KEYS.FIELD_MAPPINGS) as FieldMapping[]) || [],
    };
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
    if (settings.accountId !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.ACCOUNT_ID, settings.accountId);
    if (settings.clientId !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.CLIENT_ID, settings.clientId);
    if (settings.userId !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.USER_ID, settings.userId);
    if (settings.privateKey !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.PRIVATE_KEY, settings.privateKey);
    if (settings.baseUrl !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.BASE_URL, settings.baseUrl);
    if (settings.workflowId !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.WORKFLOW_ID, settings.workflowId);
    if (settings.contractIdFieldId !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.CONTRACT_ID_FIELD, settings.contractIdFieldId);
    if (settings.fieldMappings !== undefined)
        await globalConfig.setAsync(CONFIG_KEYS.FIELD_MAPPINGS, settings.fieldMappings);
}