const API_VERSION = '0.1.0'

const responseFormat = (
    res,
    statusCode,
    success,
    title = '',
    message = '',
    item
) => {
    return res.status(statusCode).json({
        apiVersion: API_VERSION,
        data: {
            success,
            title,
            message,
            item,
        },
    })
}

const responseArrayFormat = (
    res,
    statusCode,
    success,
    data,
    title = '',
    message = ''
) => {
    return res.status(statusCode).json({
        apiVersion: API_VERSION,
        data: {
            success,
            title,
            message,
            items: Array.isArray(data) ? data : [data],
        },
    })
}

const errorResponseFormat = (res, statusCode, message, error = null) => {
    return res.status(statusCode).json({
        apiVersion: API_VERSION,
        data: {
            success: false,
            message,
            error,
        },
    })
}

module.exports = {
    responseFormat,
    responseArrayFormat,
    errorResponseFormat,
}
