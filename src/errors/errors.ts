export class ConfigError extends Error{
    constructor(msg: string) {
        super(msg);
    }
}

export class SecretError extends ConfigError{
    constructor(msg: string) {
        super(msg);
    }
}

export class boxCreationError extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "BoxCreationError"
    }
}

export class NotEnoughFund extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "NotEnoughFund"
    }
}
