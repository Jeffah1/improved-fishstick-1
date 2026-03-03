// Server-side in-memory mock database
// Note: This will reset on every serverless function cold start.
// For a real app, use a persistent database.

export const usersStore: any[] = [];
export const productsStore: any[] = [];
export const ordersStore: any[] = [];
