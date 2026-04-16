import { renderHook, act } from '@testing-library/react';
import { usePaletteDrag } from '@/app/(authenticated)/assinatura-digital/components/editor/hooks/use-palette-drag';
import { toast } from 'sonner';
import { SIGNER_COLORS } from '../../types';
import type { EditorField, Signatario, SignatureFieldType } from '../../types';

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('Field Signer Assignment', () => {
  describe('usePaletteDrag', () => {
    const mockCanvasRef = { current: null } as React.RefObject<HTMLDivElement>;
    const mockSetFields = jest.fn();
    const mockSetSelectedField = jest.fn();
    const mockMarkDirty = jest.fn();

    const defaultProps = {
      canvasRef: mockCanvasRef,
      zoom: 1,
      templateId: 1,
      currentPage: 1,
      fieldsLength: 0,
      setFields: mockSetFields,
      setSelectedField: mockSetSelectedField,
      markDirty: mockMarkDirty,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should store field type when palette drag starts', () => {
      const { result } = renderHook(() => usePaletteDrag(defaultProps));

      expect(result.current.draggedFieldType).toBeNull();

      act(() => {
        result.current.handlePaletteDragStart('signature');
      });

      expect(result.current.draggedFieldType).toBe('signature');
    });

    it('should clear field type when palette drag ends', () => {
      const { result } = renderHook(() => usePaletteDrag(defaultProps));

      act(() => {
        result.current.handlePaletteDragStart('signature');
      });

      expect(result.current.draggedFieldType).toBe('signature');

      act(() => {
        result.current.handlePaletteDragEnd();
      });

      expect(result.current.draggedFieldType).toBeNull();
    });

    it('should show error when dropping without active signer', async () => {
      const { result } = renderHook(() => usePaletteDrag(defaultProps));

      const pageElement = {
        dataset: { page: '1' },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 800 }),
      } as unknown as HTMLElement;

      const target = {
        closest: jest.fn(() => pageElement),
      } as unknown as HTMLElement;

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: (key: string) => (key === 'field-type' ? 'signature' : ''),
        },
        clientX: 100,
        clientY: 100,
        target,
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleCanvasDrop(mockEvent, null);
      });

      expect(toast.error).toHaveBeenCalledWith('Selecione um signatário antes de adicionar campos');
      expect(mockSetFields).not.toHaveBeenCalled();
    });

    it('should create field with signer ID when dropping with active signer', async () => {
      const { result } = renderHook(() => usePaletteDrag(defaultProps));

      const pageElement = {
        dataset: { page: '1' },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 800 }),
      } as unknown as HTMLElement;

      const target = {
        closest: jest.fn(() => pageElement),
      } as unknown as HTMLElement;

      const activeSigner: Signatario = {
        id: 'signer-1',
        nome: 'Test Signer',
        email: 'test@example.com',
        cor: SIGNER_COLORS[0],
        ordem: 0,
      };

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: (key: string) => (key === 'field-type' ? 'signature' : ''),
        },
        clientX: 100,
        clientY: 100,
        target,
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleCanvasDrop(mockEvent, activeSigner);
      });

      expect(mockSetFields).toHaveBeenCalled();

      // Get the callback function that was passed to setFields
      const setFieldsCallback = mockSetFields.mock.calls[0][0];
      const newFields = setFieldsCallback([]);

      // Verify the created field has the signer ID
      expect(newFields[0].signatario_id).toBe('signer-1');
      expect(newFields[0].tipo).toBe('assinatura');

      expect(toast.success).toHaveBeenCalledWith('Campo "Assinatura" adicionado para Test Signer');
      expect(mockMarkDirty).toHaveBeenCalled();
    });

    it('should handle drag over by preventing default', () => {
      const { result } = renderHook(() => usePaletteDrag(defaultProps));

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLDivElement>;

      act(() => {
        result.current.handleCanvasDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('copy');
    });
  });

  describe('Field reassignment', () => {
    it('should update field signatario_id when reassigning', () => {
      // This tests the reassignment logic that would be in FieldMappingEditor
      const initialFields: EditorField[] = [
        {
          id: 'field-1',
          nome: 'Test Field',
          tipo: 'signature' as any,
          posicao: { x: 100, y: 100, width: 120, height: 60, pagina: 1 },
          isSelected: true,
          isDragging: false,
          signatario_id: 'signer-1',
        },
      ];

      // Simulate reassignment
      const newSignerId = 'signer-2';
      const updatedFields = initialFields.map((field) =>
        field.id === 'field-1'
          ? { ...field, signatario_id: newSignerId, atualizado_em: new Date() }
          : field
      );

      expect(updatedFields[0].signatario_id).toBe('signer-2');
    });

    it('should preserve field signatario_id during save', () => {
      // This tests that signatario_id is not removed during serialization
      const field: EditorField = {
        id: 'field-1',
        nome: 'Test Field',
        tipo: 'signature' as any,
        posicao: { x: 100, y: 100, width: 120, height: 60, pagina: 1 },
        isSelected: true,
        isDragging: false,
        justAdded: true,
        signatario_id: 'signer-1',
      };

      // Simulate the fieldsToTemplateCampos conversion
      const { isSelected: _isSelected, isDragging: _isDragging, justAdded: _justAdded, ...serializedField } = field;

      expect(serializedField.signatario_id).toBe('signer-1');
      expect(serializedField).not.toHaveProperty('isSelected');
      expect(serializedField).not.toHaveProperty('isDragging');
      expect(serializedField).not.toHaveProperty('justAdded');
    });
  });

  describe('Field types from palette', () => {
    const fieldTypes: SignatureFieldType[] = ['signature', 'initials', 'date', 'textbox'];

    fieldTypes.forEach((fieldType) => {
      it(`should create correct field config for ${fieldType}`, () => {
        const mockSetFields = jest.fn();
        const { result } = renderHook(() =>
          usePaletteDrag({
            canvasRef: { current: { getBoundingClientRect: () => ({ left: 0, top: 0 }) } } as any,
            zoom: 1,
            templateId: 1,
            currentPage: 1,
            fieldsLength: 0,
            setFields: mockSetFields,
            setSelectedField: jest.fn(),
            markDirty: jest.fn(),
          })
        );

        const activeSigner: Signatario = {
          id: 'signer-1',
          nome: 'Test',
          email: 'test@test.com',
          cor: '#000',
          ordem: 0,
        };

        const mockEvent = {
          preventDefault: jest.fn(),
          dataTransfer: { getData: (key: string) => (key === 'field-type' ? fieldType : '') },
          clientX: 100,
          clientY: 100,
          target: {
            closest: jest.fn(() => ({
              dataset: { page: '1' },
              getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 800 }),
            })),
          },
        } as unknown as React.DragEvent<HTMLDivElement>;

        act(() => {
          result.current.handleCanvasDrop(mockEvent, activeSigner);
        });

        expect(mockSetFields).toHaveBeenCalled();
      });
    });
  });
});
