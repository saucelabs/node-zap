export const instances = []

export default class FormData {
    public append = jest.fn()

    constructor () {
        instances.push(this)
    }
}
