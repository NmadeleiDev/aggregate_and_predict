export function createSuccessResponse(payload: any) {
    return {status: true, data: payload}
}

export function createFailResponse(payload: any) {
    return {status: false, data: payload}
}