export interface IKeyValue {
    [key: string]: any;
}

export interface IResult {
    raw: IKeyValue;
    xmp: IKeyValue[];
}

export function fromFile(path: string): Promise<IResult>;
export function flatten(xmp: IKeyValue[]): IKeyValue;
export function fromBuffer(buf: Buffer): IResult;

