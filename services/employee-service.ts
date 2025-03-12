import { Employee, EmployeeType } from "@prisma/client";

// Types for API requests
export interface CreateEmployeeRequest {
    name: string;
    email: string;
    type: EmployeeType;
    workDays: string | null;
    organizationId: number;
    avgEfficiency?: number;
    inductorEff?: number;
    stowerEff?: number;
    downstackerEff?: number;
  }
  
  export interface UpdateEmployeeRequest {
    name?: string;
    email?: string;
    type?: EmployeeType;
    workDays?: string | null;
    avgEfficiency?: number;
    inductorEff?: number;
    stowerEff?: number;
    downstackerEff?: number;
  }

// Types for API responses
interface ApiSuccessResponse<T> {
  message: string;
  [key: string]: any; // For employee, employees, etc.
}

interface ApiErrorResponse {
  message: string;
  details?: any;
}

// Adapted response type to match your API pattern
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function to process API responses
function processResponse<T>(responseData: ApiSuccessResponse<T> | ApiErrorResponse, status: number): ApiResponse<T> {
  const isSuccess = status >= 200 && status < 300;
  
  if (isSuccess) {
    const successResponse = responseData as ApiSuccessResponse<T>;
    // Extract the data from the response (employee, employees, etc.)
    const dataKey = Object.keys(successResponse).find(key => 
      key !== 'message' && key !== 'details'
    );
    
    const data = dataKey ? successResponse[dataKey] : undefined;
    
    return {
      success: true,
      data: data as T
    };
  } else {
    const errorResponse = responseData as ApiErrorResponse;
    return {
      success: false,
      error: errorResponse.message
    };
  }
}

// Employee service methods
export const EmployeeService = {
  // Get all employees for an organization
  async getEmployees(organizationId: number): Promise<ApiResponse<Employee[]>> {
    try {
      const response = await fetch(`/api/employees?organizationId=${organizationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return processResponse<Employee[]>(data, response.status);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { success: false, error: 'Failed to fetch employees' };
    }
  },

  // Get a single employee by ID
  async getEmployee(id: number): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return processResponse<Employee>(data, response.status);
    } catch (error) {
      console.error(`Error fetching employee ${id}:`, error);
      return { success: false, error: 'Failed to fetch employee' };
    }
  },

  // Create a new employee
  async createEmployee(data: CreateEmployeeRequest): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      return processResponse<Employee>(responseData, response.status);
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: 'Failed to create employee' };
    }
  },

  // Update an existing employee
  async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      return processResponse<Employee>(responseData, response.status);
    } catch (error) {
      console.error(`Error updating employee ${id}:`, error);
      return { success: false, error: 'Failed to update employee' };
    }
  },

  // Delete an employee (soft delete)
  async deleteEmployee(id: number): Promise<ApiResponse<Employee>> {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      return processResponse<Employee>(responseData, response.status);
    } catch (error) {
      console.error(`Error deleting employee ${id}:`, error);
      return { success: false, error: 'Failed to delete employee' };
    }
  },
};