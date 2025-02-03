import Imap from "imap";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";

dotenv.config();

class EmailService {
    private imap: Imap;
    private transporter: nodemailer.Transporter;

    constructor() {
        this.imap = new Imap({
            user: process.env.MAIL_USER!,
            password: process.env.MAIL_PASS!,
            host: process.env.MAIL_HOST!,
            port: Number(process.env.MAIL_IMAP_PORT),
            tls: true
        });

        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST!,
            port: Number(process.env.MAIL_SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.MAIL_USER!,
                pass: process.env.MAIL_PASS!
            },
            requireTLS: false,
            tls: {
                rejectUnauthorized: false
            }
        });
    }

    async sendEmail(to: string, subject: string, text: string): Promise<void> {
        try {
            const mailOptions: nodemailer.SendMailOptions = {
                from: `"${process.env.MAIL_USER_NAME}" <${process.env.MAIL_USER}>`,
                to,
                subject,
                text
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);

            this.appendToSentFolder(mailOptions);
        } catch (error) {
            console.error("❌ Email sending failed:", error);
            throw error;
        }
    }

    private appendToSentFolder(mailOptions: nodemailer.SendMailOptions): void {
        this.imap.once("ready", () => {
            this.imap.openBox("Sent", false, (err) => {
                if (err) {
                    console.error("❌ IMAP Open Sent Box Error:", err);
                    return;
                }

                const emailContent =
                    `From: ${mailOptions.from}\r\n` +
                    `To: ${mailOptions.to}\r\n` +
                    `Subject: ${mailOptions.subject}\r\n` +
                    `Date: ${new Date().toUTCString()}\r\n` +
                    `\r\n${mailOptions.text}`;

                this.imap.append(
                    emailContent,
                    { mailbox: "Sent", flags: ["\\Seen"] },
                    (appendErr) => {
                        if (appendErr) {
                            console.error(
                                "❌ IMAP Append to Sent Error:",
                                appendErr
                            );
                        } else {
                            console.log("✅ Email saved to IMAP Sent folder.");
                        }
                        this.imap.end();
                    }
                );
            });
        });

        this.imap.once("error", (err: any) => {
            console.error("❌ IMAP Connection Error:", err);
        });

        this.imap.connect();
    }
}

export default EmailService;
