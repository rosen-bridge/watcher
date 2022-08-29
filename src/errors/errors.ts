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

export class NoWID extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "Watcher WID is not set"
    }
}

export class NoObservationStatus extends Error {
    constructor(message?: string) {
        super(message)
        this.name = "The observation doesn't have a status"
    }
}
