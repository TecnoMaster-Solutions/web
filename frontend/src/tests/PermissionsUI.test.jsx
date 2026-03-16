import { render, screen } from "@testing-library/react";
import ClientsTable from "@/features/dashboard/Clients/components/clientsTable";
import { AuthProvider } from "@/features/auth/authcontext";

describe("Permissions UI", () => {

  test("usuario sin permisos no ve botón eliminar", () => {

    render(
      <AuthProvider>
        <ClientsTable
          clients={[]}
          onView={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onCreate={() => {}}
        />
      </AuthProvider>
    );

    const deleteButton = screen.queryByText(/delete/i);

    expect(deleteButton).not.toBeInTheDocument();

  });

});