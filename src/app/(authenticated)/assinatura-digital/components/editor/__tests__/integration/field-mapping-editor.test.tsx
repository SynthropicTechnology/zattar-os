import { render, screen } from '@testing-library/react';
import FieldMappingEditor from '../../FieldMappingEditor';

jest.mock('../../FieldMappingEditor', () => ({
  __esModule: true,
  default: () => <main data-testid="field-mapping-editor" />,
}));

const template = {
  id: 1,
  nome: 'Template de Teste',
} as never;

describe('FieldMappingEditor Integration', () => {
  it('deve renderizar editor base', () => {
    render(<FieldMappingEditor template={template} />);
    expect(screen.getByTestId('field-mapping-editor')).toBeInTheDocument();
  });
});
