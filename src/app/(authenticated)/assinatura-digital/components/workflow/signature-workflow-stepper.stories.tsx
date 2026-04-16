import type { Meta, StoryObj } from '@storybook/react';
import { SignatureWorkflowStepper } from './signature-workflow-stepper';

const meta: Meta<typeof SignatureWorkflowStepper> = {
    title: 'Assinatura Digital/Workflow/SignatureWorkflowStepper',
    component: SignatureWorkflowStepper,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        allowNavigation: false,
    },
};

export const WithNavigation: Story = {
    args: {
        allowNavigation: true,
        onStepClick: (step) => console.log('Clicked step:', step),
    },
};

export const Mobile: Story = {
    args: {
        allowNavigation: false,
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
