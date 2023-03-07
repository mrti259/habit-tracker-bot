import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

import {
    Filter,
    Identificable,
    Page,
    Properties,
    SearchParams,
} from './Database';

type SchemaProperties<T> = {
    [key in keyof T]: Property<T[key]>;
};

type PageProperty = any;

export class Schema<T> {
    constructor(public properties: SchemaProperties<T>) {}

    getFilters(searchParams: SearchParams<T>): Filter | null {
        const filters: Array<Filter> = [];

        for (const propertyName in searchParams) {
            const property = this.properties[propertyName];
            const values = searchParams[propertyName];
            if (!property || !values) continue;
            const filter = property.filter(values);
            if (!filter) continue;
            filters.push(filter);
        }

        if (filters.length === 0) return null;

        return { and: filters } as Filter;
    }

    getProperties(model: T): Properties {
        const properties: Properties = {};

        for (const propertyName in model) {
            const property = this.properties[propertyName];
            const value = model[propertyName];
            if (!property || !value) continue;
            properties[property.name] = property.mapValue(value);
        }

        return properties;
    }

    mapPage(page: Page): Identificable<T> {
        const model = { id: page.id } as Identificable<T>;
        const { properties } = page as PageObjectResponse;

        if (!properties) return model;

        for (const propertyName in this.properties) {
            const property = this.properties[propertyName];
            const pageProperty = properties[property.name];
            model[propertyName] = property.mapPageProperty(pageProperty) as any;
        }

        return model;
    }
}

export abstract class Property<TValue> {
    constructor(public name: string) {}

    filter(values: Array<TValue>): Filter {
        const filters = { or: values.map((value) => this._filter(value)) };
        return filters as Filter;
    }

    protected abstract _filter(value: TValue): Filter;

    abstract mapValue(value: TValue): PageProperty;

    abstract mapPageProperty(pageProperty: PageProperty): TValue | null;
}

export class TitleProperty extends Property<string> {
    protected _filter(value: string): Filter {
        return {
            property: this.name,
            title: value ? { equals: value } : { is_empty: true },
        };
    }

    mapValue(value: string): PageProperty {
        return { title: [{ text: { content: value } }] };
    }

    mapPageProperty(pageProperty: PageProperty): string {
        return pageProperty.title
            .map((text: { plain_text: string }) => text.plain_text)
            .join('');
    }
}

export class RichTextProperty extends Property<string> {
    protected _filter(value: string): Filter {
        return {
            property: this.name,
            rich_text: value ? { equals: value } : { is_empty: true },
        };
    }

    mapValue(value: string): PageProperty {
        return { rich_text: [{ text: { content: value } }] };
    }

    mapPageProperty(pageProperty: PageProperty): string {
        return pageProperty.rich_text
            .map((text: { plain_text: string }) => text.plain_text)
            .join('');
    }
}

export class NumberProperty extends Property<number> {
    protected _filter(value: number): Filter {
        return {
            property: this.name,
            number: { equals: value },
        };
    }

    mapValue(value: number): PageProperty {
        return { number: value };
    }

    mapPageProperty(pageProperty: PageProperty): number {
        return pageProperty.number;
    }
}

export class CheckboxProperty extends Property<boolean> {
    protected _filter(value: boolean): Filter {
        return {
            property: this.name,
            checkbox: { equals: value },
        };
    }

    mapValue(value: boolean): PageProperty {
        return { checkbox: value };
    }

    mapPageProperty(pageProperty: PageProperty): boolean {
        return pageProperty.checkbox;
    }
}

export class DateProperty extends Property<Date> {
    private format(value: Date): string {
        const year = value.getFullYear();
        const month = value.getMonth();
        const day = value.getDay();
        const f = (n: number) => n.toString().padStart(2, '0');
        return `${year}-${f(month)}-${f(day)}`;
    }

    protected _filter(value: Date): Filter {
        return {
            property: this.name,
            date: { equals: this.format(value) },
        };
    }

    mapValue(value: Date): PageProperty {
        return { date: { start: this.format(value) } };
    }

    mapPageProperty(pageProperty: PageProperty): Date {
        return new Date(pageProperty.date.start);
    }
}

export class RelationProperty extends Property<string> {
    protected _filter(value: string): Filter {
        return {
            property: this.name,
            relation: value ? { contains: value } : { is_empty: true },
        };
    }

    mapValue(value: string): PageProperty {
        return { relation: [{ id: value }] };
    }

    mapPageProperty(pageProperty: PageProperty): string | null {
        return pageProperty.relation[0]?.id || null;
    }
}
