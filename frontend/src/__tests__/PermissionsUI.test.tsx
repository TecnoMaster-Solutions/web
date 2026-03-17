import { render, screen } from '@testing-library/react';
import TechniciansTable from '@/features/dashboard/technicians/components/tableTechnicians/tableTechnicians';

type DataTableMockProps = {
  module: string;
  createButtonText?: string;
};

const DataTableMock = jest.fn((props: DataTableMockProps) => {
  return (
    <div>
      <div data-testid="datatable-module">{props.module}</div>
      <button>{props.createButtonText}</button>
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

describe('PermissionsUI', () => {
  it('muestra la acción visual de crear técnico en el módulo technicians', () => {
    render(
      <TechniciansTable
        technicians={[]}
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

    expect(screen.getByTestId('datatable-module')).toHaveTextContent('technicians');
    expect(
      screen.getByRole('button', { name: /crear técnico/i })
    ).toBeInTheDocument();
  });
});
