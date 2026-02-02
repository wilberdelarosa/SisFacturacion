export abstract class DomainError {
    public readonly message: string;
    public readonly code: string;

    constructor(message: string, code: string = 'GENERIC_DOMAIN_ERROR') {
        this.message = message;
        this.code = code;
    }
}
