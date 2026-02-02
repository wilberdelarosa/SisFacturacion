import { randomUUID } from 'node:crypto';

export abstract class Entity<T> {
    protected readonly _id: string;
    protected props: T;

    constructor(props: T, id?: string) {
        const uuid = typeof randomUUID === 'function' ? randomUUID() : `${Date.now()}-${Math.random()}`;
        this._id = id ? id : uuid;
        this.props = props;
    }

    get id(): string {
        return this._id;
    }

    public equals(object?: Entity<T>): boolean {
        if (object == null || object == undefined) {
            return false;
        }

        if (this === object) {
            return true;
        }

        if (!(object instanceof Entity)) {
            return false;
        }

        return this._id === object._id;
    }
}
