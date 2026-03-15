import { render, screen } from '@testing-library/react';
import TechniciansTable from '@/features/dashboard/technicians/components/tableTechnicians/tableTechnicians';
import { Technician } from '@/features/dashboard/technicians/types/typesTechnicians';

type DataTableMockProps = {
  data: Technician[];
  createButtonText?: string;
  searchPlaceholder?: string;
};

const DataTableMock = jest.fn((props: DataTableMockProps) => {
  return (
    <div>
      <div data-testid="rows-count">{props.data.length}</div>
      <div data-testid="first-name">{props.data[0]?.name ?? ''}</div>
      <div data-testid="create-button-text">{props.createButtonText}</div>
      <div data-testid="search-placeholder">{props.searchPlaceholder}</div>
    </div>
  );
});

jest.mock('@/features/dashboard/components/datatable/DataTable', () => ({
  DataTable: (props: DataTableMockProps) => DataTableMock(props),
}));

jest.mock('@/shared/theme/colors', () => ({
  __esModule: true,
  default: {
    states: {
      success: '#00aa00',
      inactive: '#999999',
    },
  },
}));

describe('TechniciansList', () => {
  it('renderiza correctamente la lista de técnicos', () => {
    const technicians: Technician[] = [
      {
        id: 2,
        name: 'Carlos',
        lastName: 'Pérez',
        documentType: 'CC',
        documentNumber: '123456',
        phone: '3001234567',
        email: 'carlos@test.com',
        types: ['Cableado estructurado'],
        state: 'Activo',
      },
      {
        id: 1,
        name: 'Ana',
        lastName: 'Gómez',
        documentType: 'CC',
        documentNumber: '654321',
        phone: '3007654321',
        email: 'ana@test.com',
        types: ['Redes'],
        state: 'Activo',
      },
    ];

    render(
      <TechniciansTable
        technicians={technicians}
        page={1}
        limit={5}
        totalPages={1}
        search=""
        onPageChange={jest.fn()}
        onSearchChange={jest.fn()}
        onView={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onCreate={jest.fn()}
      />
    );

    expect(screen.getByTestId('rows-count')).toHaveTextContent('2');
    expect(screen.getByTestId('first-name')).toHaveTextContent('Carlos');
    expect(screen.getByTestId('create-button-text')).toHaveTextContent('Crear Técnico');
    expect(screen.getByTestId('search-placeholder')).toHaveTextContent('Buscar técnicos...');
  });
});
