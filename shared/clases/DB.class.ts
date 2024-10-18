import 'reflect-metadata';
import {v4 as uuid4} from 'uuid';
import {validate, ValidationError} from 'class-validator';
import {DBClient} from '../interfaces/DBClient.interface';

export class DB<T extends object, U> {
    constructor(private dbClient: DBClient<T, U>) {}

    protected uuid (): string {
        return uuid4();
    }

    private extractErrors(errors: ValidationError[], parentProperty?: string): any[] {
        let extractedErrors: any[] = [];
        for (const error of errors) {
            const propertyName: string = parentProperty ? `${parentProperty}.${error.property}` : error.property;

            if (error.constraints) {
                extractedErrors.push({
                    property: propertyName,
                    constraints: Object.values(error.constraints),
                });
            }

            if (error.children && error.children.length > 0) {
                extractedErrors = extractedErrors.concat(this.extractErrors(error.children, propertyName));
            }
        }

        return extractedErrors;
    }

    protected async save(params: T, model: T): Promise<any> {
        try {
            const errors: ValidationError[] = await validate(model, { skipMissingProperties: false });

            if (errors.length > 0) {
                const formattedErrors: any[] = this.extractErrors(errors);

                return {
                    errors: formattedErrors,
                };
            }

            return this.dbClient.save(params);
        } catch (error) {
            console.error('Error while saving:', error);
            throw error;
        }
    }

    protected findOne(params: T): Promise<U> {
        try {
            return this.dbClient.findOne(params);
        } catch (error) {
            console.error('Error while finding one:', error);
            throw error;
        }
    }

    protected delete(params: T): Promise<U> {
        try {
            return this.dbClient.delete(params);
        } catch (error) {
            console.error('Error while deleting:', error);
            throw error;
        }
    }

    protected query(params: T): Promise<U> {
        try {
            return this.dbClient.query(params);
        } catch (error) {
            console.error('Error while querying:', error);
            throw error;
        }
    }

    protected update(params: T): Promise<U> {
        try {
            return this.dbClient.update(params);
        } catch (error) {
            console.error('Error while updating:', error);
            throw error;
        }
    }
}
