import React from 'react';
import { initializeBlock } from '@airtable/blocks/ui';
import { MainInterface } from './ui';

initializeBlock(() => <MainInterface />);