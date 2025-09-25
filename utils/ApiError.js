class ApiError extends Error {
    constructor(
        statusCode = 500,
        message="Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.errors = errors
        this.sucess = false

        if(stack) {
            this.stack = stack
            Error.captureStackTrace(this, this.constructor)
        }
    } 
}

export {ApiError}
