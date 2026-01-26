export class ExampleService {
  async getData() {
    return {
      message: 'Data from service layer',
      timestamp: new Date().toISOString(),
    };
  }

  async processData(data: any) {
    // Business logic here
    return {
      ...data,
      processed: true,
      processedAt: new Date().toISOString(),
    };
  }
}

export const exampleService = new ExampleService();
