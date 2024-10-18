export interface DBClient<T, U> {
    save(params: T): Promise<U>;
    query(params: T): Promise<U>;
    update(params: T): Promise<U>;
    delete(params: T): Promise<U>;
    findOne(params: T): Promise<U>;
}
