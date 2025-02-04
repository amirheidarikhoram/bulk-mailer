import Imap from "imap";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as csv from "csv-parse";
import * as path from "path";

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

    private processTemplate(template: string, data: RecipientData): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] || match;
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        text: string
    ): Promise<nodemailer.SendMailOptions> {
        try {
            const mailOptions: nodemailer.SendMailOptions = {
                from: `"${process.env.MAIL_USER_NAME}" <${process.env.MAIL_USER}>`,
                to,
                subject,
                text
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${to}: ${info.messageId}`);

            return mailOptions;
        } catch (error) {
            console.error("❌ Email sending failed:", error);
            throw error;
        }
    }

    private appendToSentFolder(
        mailOptionsList: nodemailer.SendMailOptions[]
    ): void {
        this.imap.once("ready", () => {
            this.imap.openBox("Sent", false, (err) => {
                if (err) {
                    console.error("❌ IMAP Open Sent Box Error:", err);
                    return;
                }

                for (const item of mailOptionsList) {
                    const emailContent =
                        `From: ${item.from}\r\n` +
                        `To: ${item.to}\r\n` +
                        `Subject: ${item.subject}\r\n` +
                        `Date: ${new Date().toUTCString()}\r\n` +
                        `\r\n${item.text}`;

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
                                console.log(
                                    `✅ Email saved to IMAP Sent folder: ${item.to}`
                                );
                            }
                        }
                    );
                }

                this.imap.end();
            });
        });

        this.imap.once("error", (err: any) => {
            console.error("❌ IMAP Connection Error:", err);
        });

        this.imap.connect();
    }

    async sendBulkEmails(templatePath: string, csvPath: string): Promise<void> {
        let hadError = false;
        let failedEmails: string[] = [];

        let mailOptionsList: nodemailer.SendMailOptions[] = [];

        const template = JSON.parse(
            fs.readFileSync(templatePath, "utf-8")
        ) as EmailTemplate;

        try {
            const records = await this.parseCSV(csvPath);
            console.log(`📊 Found ${records.length} recipients`);

            for (const recipient of records) {
                try {
                    const processedSubject = this.processTemplate(
                        template.subject,
                        recipient
                    );
                    const processedBody = this.processTemplate(
                        template.body,
                        recipient
                    );

                    const mailOptions = await this.sendEmail(
                        recipient.email,
                        processedSubject,
                        processedBody
                    );

                    mailOptionsList.push(mailOptions);
                } catch (error) {
                    console.error(
                        `❌ Failed to send email to ${recipient.email}:`,
                        error
                    );

                    hadError = true;

                    failedEmails.push(recipient.email);
                }
            }
        } catch (error) {
            console.error("❌ Failed to parse CSV:", error);
            throw error;
        } finally {
            this.appendToSentFolder(mailOptionsList);

            if (hadError) {
                await this.writeFailedEmails(failedEmails);
                throw new Error("❌ Failed to send some emails");
            }
        }
    }

    private async parseCSV(csvPath: string): Promise<RecipientData[]> {
        return new Promise((resolve, reject) => {
            const records: RecipientData[] = [];
            fs.createReadStream(csvPath)
                .pipe(
                    csv.parse({
                        columns: true,
                        skip_empty_lines: true,
                        trim: true
                    })
                )
                .on("data", (data) => records.push(data))
                .on("error", (error) => reject(error))
                .on("end", () => {
                    console.log("✅ CSV parsing completed");
                    resolve(records);
                });
        });
    }

    private async writeFailedEmails(emails: string[]): Promise<void> {
        const filePath = path.join(__dirname, "failed-emails.txt");
        fs.writeFileSync(filePath, emails.join("\n"));
        console.log(`✅ Failed emails written to ${filePath}`);
    }
}

export default EmailService;
