export class ApiError extends Error {
    private status: number;

    constructor (message: string, status: number) {
    	super(message)
    	this.message = message
    	this.status = status
    	this.name = 'ApiError'
    }

    getResponse () {
    	return {
    		status: this.status,
    		message: this.message
    	}
    }
}
