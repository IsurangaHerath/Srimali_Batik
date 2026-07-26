export const API_BASE_URL = '/api';
export const WHATSAPP_NUMBER = '94769652924';

export const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmMGU4Ii8+PHRleHQgeD0iNTAlIiB5PSI0NSUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjQ4IiBmaWxsPSIjYzhiODk4Ij7wn6a3PC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjUlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iI2E4OTg4OCI+SW1hZ2Ugbm90IHNldDwvdGV4dD48L3N2Zz4=';

export const PRODUCT_TYPES = ['Saree', 'Frock', 'Sarong', 'Shirt', 'Dress', 'Other'] as const;

export const WS_EVENT_TYPES = {
    PATTERN_CREATED: 'pattern_created',
    PATTERN_UPDATED: 'pattern_updated',
    PATTERN_DELETED: 'pattern_deleted',
    PRODUCT_CREATED: 'product_created',
    PRODUCT_UPDATED: 'product_updated',
    PRODUCT_DELETED: 'product_deleted',
    COLOR_CREATED: 'color_created',
    COLOR_UPDATED: 'color_updated',
    COLOR_DELETED: 'color_deleted',
} as const;
