import { MongoClient } from "mongodb";
import { DBClient } from '../interfaces/DBClient.interface';

export class MongoDB implements DBClient<any, any> {

  private dbName: string = 'atizapan';
  private static instance: MongoDB;
  private connection: MongoClient = new MongoClient('mongodb://aT1ZaP4n:3PyrGyE9BQdBNC0KN1149C@140.84.187.202:27017', {
    connectTimeoutMS: 4000,
    serverSelectionTimeoutMS: 4000
  });

  public static getInstance(): MongoDB {
    if (!this.instance) {
      this.instance = new MongoDB();
    }

    return this.instance;
  }

  async save(data: any): Promise<any> {
    try {
      const collection = this.connection.db(this.dbName).collection(data.TableName);
      return await collection.insertOne(data.Item);
    } catch (error) {
      console.error('Error al guardar en la base de datos Mongo:', error);
      throw error;
    }
  }

  async query(data: any): Promise<any> {
    try {
      const collection = this.connection.db(this.dbName).collection(data.TableName);
      let query = collection.find(data.params);

      if (data.orderBy) {
        query = query.sort(data.orderBy);
      }

      return { Items: await query.toArray() };
    } catch (error) {
      console.error(
        'Error al realizar una consulta en la base de datos Mongo:',
        error
      );

      return {Items: []};
    }
  }

  delete(params: any): Promise<any> {
    return Promise.resolve(undefined);
  }

  findOne(params: any): Promise<any> {
    return Promise.resolve(undefined);
  }

  update(params: any): Promise<any> {
    return Promise.resolve(undefined);
  }
}
