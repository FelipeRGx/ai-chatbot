import {SyncRedactor} from 'redact-pii';

interface IPIISanitizer {
    redact(text: string): string;
    restore(text: string): string;
}

export class PIISanitizer implements IPIISanitizer {
    private redactor: SyncRedactor;
    private piiMap: Map<string, string>;

    constructor() {
        this.redactor = new SyncRedactor();
        this.piiMap = new Map();
    }

    private generateUniqueId(): string {
        return `PII_${Math.random().toString(36).substr(2, 9)}`;
    }

    private getIdForValue(value: string): string {
        if (!this.piiMap.has(value)) {
            this.piiMap.set(value, this.generateUniqueId());
        }
        return this.piiMap.get(value) as string;
    }

    public redact(text: string): string {
        let redactedText: string = text;
        const namePattern: RegExp = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
        redactedText = redactedText.replace(namePattern, (match) => {
            return this.getIdForValue(match);
        });
        return text;//redactedText
    }

    public restore(text: string): string {
        let restoredText: string = text;
        for (let [value, id] of this.piiMap.entries()) {
            restoredText = restoredText.replace(new RegExp(id, 'g'), value);
        }
        this.clearMap();
        return restoredText;
    }

    private clearMap(): void {
        this.piiMap.clear();
    }
}
