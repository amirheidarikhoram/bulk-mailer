interface EmailTemplate {
    subject: string;
    body: string;
}

interface RecipientData {
    email: string;
    [key: string]: string;
}
