export function objToEncondedString(obj: any): string {
    return encodeURI(JSON.stringify(obj));
}