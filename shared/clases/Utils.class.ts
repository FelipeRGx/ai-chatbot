import {v4} from 'uuid';
import transform from 'lodash/transform';
import {isEqual, isObject} from 'lodash';
import * as moment from 'moment-timezone';

export class Utils {

    static sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get a unique hash id
     */
    static generateUUID () {
        return v4();
    }

    /**
     * Check if value is a valid JSON structure
     * @param str
     * @returns {boolean}
     */
    static isJson(str: string): boolean {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }

        return true;
    }

    /**
     * Check if variable is object type
     * @param object
     * @returns {boolean}
     */
    static isObject(object: any): boolean {
        return isObject(object);
    }

    /**
     * Get object from bean
     * @param bean
     * @returns object
     */
    static objected(bean: any) {
        if (bean) {
            if (this.isBase64(bean)) {
                const buff: any = Buffer.from(bean, 'base64');
                bean = buff.toString('UTF-8');
            }

            if (this.isJson(bean)) {
                return JSON.parse(bean);
            }

            if (this.isObject(bean)) {
                return bean;
            }
        }

        return {};
    }

    /**
     * Deep diff between two object, using lodash
     * @param  {Object} object
     * @param  {Object} base
     * @return {Object}
     */
    static objectDiff(object: any, base: any): object {
        const baseSort: any = this.sortObjectByValues(base);
        const objectSort: any = this.sortObjectByValues(object);

        return transform(objectSort, (result: any, value: any, key: string | number) => {
            if (!isEqual(value, baseSort[key])) {
                result[key] = this.isObject(value) && this.isObject(base[key]) ? this.objectDiff(value, base[key]) : value;
            }
        });
    }

    /**
     * Sort object by values
     * @param object
     */
    static sortObjectByValues(object: any) {
        return object.sort((a: any, b: any) => {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
    }

    static isBase64(str: string): boolean {
        if (typeof str === 'string') {
            if (str === '' || str.trim() === '') {
                return false;
            }

            try {
                const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
                return base64regex.test(str);
            } catch (err) {
                return false;
            }
        }

        return false;
    }

    /**
     * Get time moment time zone
     * @param tz
     * @param format
     */
    static moment(tz: string, format: string = ''): string {
        const tzOffset = moment.tz(Date.now(), tz);
        return tzOffset.format(format);
    }

    /**
     * Get time moment time zone
     * @param timestamp
     * @param tz
     * @param format
     */
    static momentByTimestamp(timestamp: number, tz: string, format: string = ''): string {
        moment.tz(Date.now(), tz);

        const tzOffset = moment.unix(timestamp);
        return tzOffset.format(format);
    }

    /**
     * Get the time zone from a Country ISO code
     * @param countryCode
     */
    static getTZCountry(countryCode: string): string {
        return moment.tz.zonesForCountry(countryCode).toString();
    }

    /**
     * Get current timestamp
     */
    static nowTimeStamp(): number {
        return Math.floor(+new Date() / 1000)
    }

    /**
     * Get current Date
     */
    static getDate(): Date {
        return new Date();
    }

    /**
     * Format timestamp YYYY-MM-DD hh:mm:ss
     * @param timestamp
     */
    static dateFromTS(timestamp: number) {
        const ts_ms = timestamp * 1000;
        const date_ob = new Date(ts_ms);

        const year = date_ob.getFullYear();
        const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);
        const day = ('0' + date_ob.getDate()).slice(-2);
        const hours = ('0' + date_ob.getHours()).slice(-2);
        const minutes = ('0' + date_ob.getMinutes()).slice(-2);
        const seconds = ('0' + date_ob.getSeconds()).slice(-2);

        return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    }

    /**
     * Format timestamp MM-DD-YYYY hh:mm:ss
     */
    static dateFormat() {
        const ts_ms = Utils.nowTimeStamp() * 1000;
        const date_ob = new Date(ts_ms);

        const year = date_ob.getFullYear();
        const day = ('0' + date_ob.getDate()).slice(-2);
        const month = ('0' + (date_ob.getMonth() + 1)).slice(-2);

        return day + '-' + month + '-' + year;
    }

    /**
     * Replacement string values by map
     * @param content
     * @param replacements
     */
    static replacementValues(content: any, replacements: any): string {
        for (const current in replacements) {
            if (replacements.hasOwnProperty(current)) {
                content = content.default.replace(`{{${current}}}`, replacements[current]);
            }
        }

        return content;
    }

    /**
     * Format number to money
     * @param amount
     * @param decimalCount
     * @param decimal
     * @param thousands
     */
    static formatMoney(amount: any, decimalCount = 2, decimal = '.', thousands = ',') {
        try {
            decimalCount = Math.abs(decimalCount);
            decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

            const negativeSign = amount < 0 ? '-' : '';

            let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
            let j = (i.length > 3) ? i.length % 3 : 0;

            return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - parseInt(i)).toFixed(decimalCount).slice(2) : '');
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * Check if string is phone number
     * @param phoneNumber
     */
    static isPhoneNumber(phoneNumber: string) {
        const match = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/im;
        return phoneNumber.match(match);
    }

    /**
     * Check if string is email
     * @param email
     */
    static isEmail(email: string) {
        const match = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        return email.match(match);
    }

    /**
     * Check if variable is a function type
     * @param functionToCheck
     */
    static isFunction(functionToCheck: any) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    /**
     * Check if string is url
     * @param url
     */
    static isUrl(url: string) {
        const match = /[(htps)?:\/w.a-zA-Z0-9@%_+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/ig;
        return url.match(match);
    }

    /**
     * Capitalize the first letter from a word
     * @param s
     */
    static capitalize = (s: string) => {
        return s.charAt(0).toUpperCase() + s.slice(1)
    }

    /**
     * Order an array
     * @param arr
     * @param orderType true - ASC, false - DESC
     */
    static orderArray = (arr: any[], orderType: boolean = true) => {
        return arr.sort((a, b) => (orderType) ? (a - b) : (b - a));
    }

    /**
     * Uniques values in array
     * @param arr
     */
    static uniqueArrayVal = (arr: any[]) => {
        return arr.filter((item, index) => {
            return arr.indexOf(item) === index;
        });
    }

    /**
     * Generate a random 6 digits
     */
    static genRandom6digit () {
        return Math.floor(100000 + Math.random() * 900000)
    }

    /**
     * Get size in bytes from object
     * @param object
     */
    static getSizeInBytes(object: any): number {
        const jsonString = JSON.stringify(object);
        return Buffer.from(jsonString).length;
    }
}
