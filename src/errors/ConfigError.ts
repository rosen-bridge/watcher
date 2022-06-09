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
