export interface EmailI {
    to:string[],
    from:string,
    data:object,
    subject:string,
    replyTo?:string[],
    attachments?:any[],
    templateName:string,
    notificationId?:string
}
