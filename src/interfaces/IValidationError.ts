export interface IValidationError {
    type: string,
    value: undefined | string,
    msg: string,
    path: string,
    location: string
}