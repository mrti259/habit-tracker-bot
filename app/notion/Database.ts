import type { Client } from '@notionhq/client';
import type {
    PageObjectResponse,
    PartialPageObjectResponse,
    QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';

import { Schema } from './Schema';

export type Identificable<T> = { id: string } & T;

export type SearchParams<Model> = {
    [k in keyof Model]?: Array<Model[k]>;
};

export type Page = PageObjectResponse | PartialPageObjectResponse;

export type Filter = QueryDatabaseParameters['filter'];

export type Properties = PageObjectResponse['properties'];

export class Database<T> {
    constructor(
        private client: Client,
        private database_id: string,
        private schema: Schema<T>,
        private cached?: boolean,
    ) {}

    private mapPages(pages: Array<Page>) {
        const results = pages.map((page) => this.schema.mapPage(page));
        if (this.cached) {
            results.forEach((result) => this.cache.add(result));
        }
        return results;
    }

    async query(searchParams: SearchParams<T>) {
        const queryParameters: QueryDatabaseParameters = {
            database_id: this.database_id,
        };

        const filter = this.schema.getFilters(searchParams);

        if (filter) {
            queryParameters['filter'] = filter;
        }

        const pages = await this.client.databases.query(queryParameters);

        return this.mapPages(pages.results);
    }

    async create(models: Array<T>) {
        const pages = await Promise.all(
            models.map((model) => {
                return this.client.pages.create({
                    parent: { database_id: this.database_id },
                    properties: this.schema.getProperties(model),
                });
            }),
        );

        return this.mapPages(pages);
    }

    async update(models: Array<Identificable<T>>) {
        const pages = await Promise.all(
            models.map((model) => {
                return this.client.pages.update({
                    page_id: model.id,
                    properties: this.schema.getProperties(model),
                });
            }),
        );

        return this.mapPages(pages);
    }

    async delete(models: Array<Identificable<T>>) {
        const pages = await Promise.all(
            models.map((model) =>
                this.client.blocks.delete({ block_id: model.id }),
            ),
        );

        return pages.map(({ id }) => {
            id;
        });
    }

    // Testing
    private cache: Set<Identificable<T>> = new Set();

    async deleteCached() {
        await this.delete(Array.from(this.cache));
    }
}
