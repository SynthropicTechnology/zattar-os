import type { Meta, StoryObj } from '@storybook/react';
import { DocumentUploadDropzone } from './document-upload-dropzone';

const meta: Meta<typeof DocumentUploadDropzone> = {
    title: 'Assinatura Digital/Upload/DocumentUploadDropzone',
    component: DocumentUploadDropzone,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        open: true,
        onOpenChange: () => { },
        onUploadSuccess: (url: string, name: string) => console.log('Uploaded:', url, name),
    },
};

export const WithError: Story = {
    args: {
        ...Default.args,
    },
    play: async () => {
        // Simular erro de upload
    },
};

export const Mobile: Story = {
    args: {
        ...Default.args,
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
};
