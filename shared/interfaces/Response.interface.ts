export interface ResponseI {
    body?: any,
    type?: string,
    success?: boolean,
    statusCode: number,
    base64Encoded?: boolean,
    resourceId?: string | number
    headers?: any
}
