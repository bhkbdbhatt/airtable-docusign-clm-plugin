import React, { useState } from 'react';
import {
    useBase,
    useRecords,
    useGlobalConfig,
    Box,
    Heading,
    Input,
    FormField,
    Button,
    Select,
    Text,
    TablePicker,
    FieldPicker,
} from '@airtable/blocks/ui';
import { loadSettings, saveSettings } from './config';
import { CLMClient } from './clmClient';
import { FieldMapping } from './types';

export const ConfigPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const base = useBase();
    const settings = loadSettings();

    const [accountId, setAccountId] = useState(settings.accountId);
    const [clientId, setClientId] = useState(settings.clientId);
    const [userId, setUserId] = useState(settings.userId);
    const [privateKey, setPrivateKey] = useState(settings.privateKey);
    const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
    const [workflowId, setWorkflowId] = useState(settings.workflowId);
    const [mappings, setMappings] = useState<FieldMapping[]>(settings.fieldMappings);

    const activeTable = base.tables[0];
    const fields = activeTable ? activeTable.fields : [];

    const handleSave = async () => {
        await saveSettings({
            accountId,
            clientId,
            userId,
            privateKey,
            baseUrl,
            workflowId,
            fieldMappings: mappings,
        });
        onClose();
    };

    const addMapping = () => {
        if (fields.length > 0) {
            setMappings([...mappings, { airtableFieldId: fields[0].id, clmFieldName: '' }]);
        }
    };

    const updateMapping = (index: number, updated: FieldMapping) => {
        const next = [...mappings];
        next[index] = updated;
        setMappings(next);
    };

    return (
        <Box padding= { 3} >
        <Heading size="small" > DocuSign CLM Admin Configuration </Heading>
            < FormField label = "Account ID" >
                <Input value={ accountId } onChange = {(e) => setAccountId(e.target.value)} />
                    </FormField>
                    < FormField label = "Integration Key (Client ID)" >
                        <Input value={ clientId } onChange = {(e) => setClientId(e.target.value)} />
                            </FormField>
                            < FormField label = "User ID (GUID)" >
                                <Input value={ userId } onChange = {(e) => setUserId(e.target.value)} />
                                    </FormField>
                                    < FormField label = "RSA Private Key" >
                                        <Input value={ privateKey } onChange = {(e) => setPrivateKey(e.target.value)} />
                                            </FormField>
                                            < FormField label = "Base API URL" >
                                                <Input value={ baseUrl } onChange = {(e) => setBaseUrl(e.target.value)} />
                                                    </FormField>
                                                    < FormField label = "Workflow ID" >
                                                        <Input value={ workflowId } onChange = {(e) => setWorkflowId(e.target.value)} />
                                                            </FormField>

                                                            < Heading size = "xsmall" marginTop = { 3} > Field Mappings </Heading>
{
    mappings.map((mapping, idx) => (
        <Box key= { idx } display = "flex" marginBottom = { 2} >
        <Select
            options={ fields.map((f) => ({ value: f.id, label: f.name })) }
            value = { mapping.airtableFieldId }
            onChange = {(val) =>
        updateMapping(idx, { ...mapping, airtableFieldId: val as string })
            }
          />
    < Input
placeholder = "CLM Parameter Name"
value = { mapping.clmFieldName }
onChange = {(e) =>
updateMapping(idx, { ...mapping, clmFieldName: e.target.value })
            }
marginLeft = { 2}
    />
    </Box>
      ))}
<Button onClick={ addMapping } icon = "plus" marginBottom = { 3} >
    Add Field Mapping
        </Button>

        < Box display = "flex" justifyContent = "flex-end" >
            <Button onClick={ handleSave } variant = "primary" >
                Save Configuration
                    </Button>
                    </Box>
                    </Box>
  );
};

export const MainInterface: React.FC = () => {
    const base = useBase();
    const settings = loadSettings();
    const [selectedTable, setSelectedTable] = useState(base.tables[0]);
    const [contractIdField, setContractIdField] = useState(
        selectedTable.fields.find((f) => f.id === settings.contractIdFieldId) || null
    );
    const records = useRecords(selectedTable);
    const [statusMap, setStatusMap] = useState<Record<string, string>>({});
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    if (isConfigOpen) {
        return <ConfigPanel onClose={ () => setIsConfigOpen(false) } />;
    }

    const handleGenerateContract = async (record: any) => {
        try {
            setStatusMap((prev) => ({ ...prev, [record.id]: 'Starting Workflow...' }));
            const clmClient = new CLMClient(settings);

            const payloadData: Record<string, unknown> = {};
            for (const map of settings.fieldMappings) {
                if (map.airtableFieldId && map.clmFieldName) {
                    payloadData[map.clmFieldName] = record.getCellValueAsString(map.airtableFieldId);
                }
            }

            const response = await clmClient.startWorkflow(payloadData);
            const documentId = response.documentId || response.id;

            if (contractIdField) {
                await selectedTable.updateRecordAsync(record, {
                    [contractIdField.id]: documentId,
                });
            }

            setStatusMap((prev) => ({ ...prev, [record.id]: 'Contract Triggered!' }));
        } catch (err: any) {
            setStatusMap((prev) => ({ ...prev, [record.id]: `Error: ${err.message}` }));
        }
    };

    const handleViewContract = async (documentId: string) => {
        try {
            const clmClient = new CLMClient(settings);
            const blobUrl = await clmClient.getDocumentBlobUrl(documentId);
            window.open(blobUrl, '_blank');
        } catch (err: any) {
            alert(`Could not open document: ${err.message}`);
        }
    };

    return (
        <Box padding= { 3} >
        <Box display="flex" justifyContent = "space-between" alignItems = "center" marginBottom = { 3} >
            <Heading size="medium" > DocuSign CLM Integration </Heading>
                < Button onClick = {() => setIsConfigOpen(true)} icon = "cog" >
                    Settings
                    </Button>
                    </Box>

                    < Box display = "flex" marginBottom = { 3} >
                        <Box marginRight={ 2 }>
                            <Text>Table: </Text>
                                < TablePicker table = { selectedTable } onChange = {(t) => setSelectedTable(t!)} />
                                    </Box>
                                    < Box >
                                    <Text>Contract ID Storage Field: </Text>
                                        < FieldPicker
table = { selectedTable }
field = { contractIdField }
onChange = {(f) => {
    setContractIdField(f);
    saveSettings({ contractIdFieldId: f ? f.id : '' });
}}
          />
    </Box>
    </Box>

{
    records.map((record) => {
        const storedDocId = contractIdField
            ? (record.getCellValueAsString(contractIdField) as string)
            : '';

        return (
            <Box
            key= { record.id }
        display = "flex"
        alignItems = "center"
        justifyContent = "space-between"
        padding = { 2}
        borderBottom = "thick"
            >
            <Text weight="bold" > { record.name || record.id } </Text>
                < Box >
                <Button
                variant="primary"
        onClick = {() => handleGenerateContract(record)
    }
                marginRight = { 2}
        >
        Generate Contract in DocuSign CLM
    </Button>

              { storedDocId && (
            <Button onClick={() => handleViewContract(storedDocId)} icon = "view" >
                View Signed Contract
                    </Button>
              )}
</Box>
{
    statusMap[record.id] && (
        <Text marginLeft={ 2 } size = "small" style = {{ italic: true }
}>
    { statusMap[record.id]}
    </Text>
            )}
</Box>
        );
      })}
</Box>
  );
};