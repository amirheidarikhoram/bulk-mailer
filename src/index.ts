import EmailService from "./mail.service";

const emailService = new EmailService();

const recipients = [
    { name: "Amir Heidari", email: "amir.heidari.khoram@gmail.com" }
];

const main = async () => {
    for (const recipient of recipients) {
        try {
            await emailService.sendEmail(
                recipient.email,
                `Hello, ${recipient.name}!`,
                "This is a test email with IMAP sent-folder saving."
            );
        } catch (error) {
            console.error(
                `❌ Failed to send email to ${recipient.email}:`,
                error
            );
        }
    }
};

main();
