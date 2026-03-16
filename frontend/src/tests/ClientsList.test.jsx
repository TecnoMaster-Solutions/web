import { render, screen } from "@testing-library/react";
import ClientsTable from "@/features/dashboard/Clients/components/clientsTable";
import { AuthProvider } from "@/features/auth/authcontext";

describe("Clients List", () => {

  test("renderiza la lista de clientes", () => {

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

    expect(screen.getByText(/clients/i)).toBeInTheDocument();

  });

});